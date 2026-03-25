/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnvFile() {
    const envPath = path.join(process.cwd(), ".env");

    if (!fs.existsSync(envPath)) {
        return;
    }

    const raw = fs.readFileSync(envPath, "utf8");
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
        if (!line || line.trim().startsWith("#")) continue;
        const idx = line.indexOf("=");
        if (idx <= 0) continue;

        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, "");

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

function getArgValue(name, fallback) {
    const prefix = `--${name}=`;
    const found = process.argv.find((arg) => arg.startsWith(prefix));
    if (!found) return fallback;

    const value = Number(found.slice(prefix.length));
    if (Number.isNaN(value) || value < 0) {
        throw new Error(`Invalid --${name} value. Must be a non-negative number.`);
    }

    return value;
}

async function ensureService(Service, config) {
    return Service.findOneAndUpdate(
        { href: config.href },
        {
            $setOnInsert: {
                id: config.id,
                name: config.name,
                fee: config.fee,
                href: config.href,
                note: config.note,
            },
        },
        { upsert: true, new: true }
    );
}

async function assignServiceToAllUsers(User, serviceId) {
    const result = await User.updateMany(
        {
            services: {
                $not: {
                    $elemMatch: { service: serviceId },
                },
            },
        },
        {
            $push: {
                services: {
                    service: serviceId,
                    fee: 0,
                },
            },
        }
    );

    return result.modifiedCount || 0;
}

async function main() {
    loadEnvFile();

    const mongoUri = process.env.MONGO_DB_URL;
    if (!mongoUri) {
        throw new Error("MONGO_DB_URL not found. Set it in environment or .env file.");
    }

    const landFee = getArgValue("land-fee", 100);
    const ldtaxFee = getArgValue("ldtax-fee", 150);

    await mongoose.connect(mongoUri);

    const serviceSchema = new mongoose.Schema(
        {
            id: { type: String, required: true, unique: true },
            name: { type: String, required: true },
            fee: { type: Number, required: true },
            href: { type: String, required: true, unique: true },
            note: { type: String },
        },
        { timestamps: true }
    );

    const userSchema = new mongoose.Schema(
        {
            services: [
                {
                    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
                    fee: { type: Number, default: 0 },
                },
                { _id: false },
            ],
        },
        { strict: false }
    );

    const Service =
        mongoose.models.Service || mongoose.model("Service", serviceSchema, "services");
    const User = mongoose.models.User || mongoose.model("User", userSchema, "users");

    const landService = await ensureService(Service, {
        id: "land-dakhila",
        name: "Land Dakhila Finder",
        href: "/land-dakhila",
        fee: landFee,
        note: "Default rate enabled",
    });

    const ldtaxService = await ensureService(Service, {
        id: "ldtax-payment",
        name: "LDTAX Payment",
        href: "/ldtax-payment",
        fee: ldtaxFee,
        note: "Link না এলে কোনো টাকা কাটা হবে না",
    });

    const landEnabledCount = await assignServiceToAllUsers(User, landService._id);
    const ldtaxEnabledCount = await assignServiceToAllUsers(User, ldtaxService._id);

    const totalUsers = await User.countDocuments({});

    console.log("Done: services enabled for all users");
    console.log(`Total users: ${totalUsers}`);
    console.log(`Land Dakhila Finder enabled newly for: ${landEnabledCount}`);
    console.log(`LDTAX Payment enabled newly for: ${ldtaxEnabledCount}`);
    console.log("Reseller can now control per-user fee from assigned services.");
}

main()
    .catch((error) => {
        console.error("Failed:", error.message || error);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await mongoose.disconnect();
        } catch {
            // ignore disconnect errors
        }
    });
