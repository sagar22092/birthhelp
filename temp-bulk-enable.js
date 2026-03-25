const mongoose = require('mongoose');

const mongoUri = 'mongodb://bdris:bdrisdata@37.60.240.128:27017/bdris';

mongoose.connect(mongoUri).then(async () => {
    console.log('✅ Connected to MongoDB');

    const serviceSchema = new mongoose.Schema({
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        fee: { type: Number, required: true },
        href: { type: String, required: true, unique: true },
        note: { type: String }
    }, { timestamps: true });

    const userSchema = new mongoose.Schema({
        services: [{
            service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
            fee: { type: Number, default: 0 }
        }, { _id: false }]
    }, { strict: false });

    const Service = mongoose.model('Service', serviceSchema, 'services');
    const User = mongoose.model('User', userSchema, 'users');

    // Ensure services exist
    const land = await Service.findOneAndUpdate(
        { href: '/land-dakhila' },
        {
            $setOnInsert: {
                id: 'land-dakhila',
                name: 'Land Dakhila Finder',
                fee: 100,
                href: '/land-dakhila',
                note: 'Default enabled'
            }
        },
        { upsert: true, new: true }
    );
    console.log('✅ Land Dakhila Finder service ready');

    const ldtax = await Service.findOneAndUpdate(
        { href: '/ldtax-payment' },
        {
            $setOnInsert: {
                id: 'ldtax-payment',
                name: 'LDTAX Payment',
                fee: 150,
                href: '/ldtax-payment',
                note: 'Link না এলে কোনো টাকা কাটা হবে না'
            }
        },
        { upsert: true, new: true }
    );
    console.log('✅ LDTAX Payment service ready');

    // Get all users and add services
    const users = await User.find({});
    console.log(`📊 Total users: ${users.length}`);

    let count = 0;
    for (const u of users) {
        let modified = false;

        const hasLand = u.services?.some(s => s.service?.toString() === land._id.toString());
        const hasLdtax = u.services?.some(s => s.service?.toString() === ldtax._id.toString());

        if (!hasLand) {
            u.services.push({ service: land._id, fee: 0 });
            modified = true;
        }
        if (!hasLdtax) {
            u.services.push({ service: ldtax._id, fee: 0 });
            modified = true;
        }

        if (modified) {
            await u.save();
            count++;
        }
    }

    console.log(`✅ Done: ${count} users updated with default services`);
    console.log('✅ All users can now control these services via reseller panel');

    process.exit(0);
}).catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
