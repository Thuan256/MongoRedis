const { Schema, Connection, Model } = require("mongoose");

/**
 * @param {Connection} connection
 * @returns {Model}
 */
exports.initialize = (connection) => {
    const UserSchema = new Schema({
        id: { type: String, require: true },
        bal: { type: Number, default: 0 },
        gem: { type: Number, default: 0 },
        rela: [{ type: String, default: '' }],
        donated: { type: Number, default: 0 },
        crate: { type: Schema.Types.Mixed, default: {} },
        verified: { type: Boolean, default: false },
        last_channel: { type: String, default: '' },
        quotes: { type: Number, default: 0 },
        //Quest
        quest: [{
            id: { type: String, default: '' },
            category: { type: String, default: '' },
            handler: { type: String, default: '' },
            type: { type: String, default: '' },
            description: { type: String, default: '' },
            finished: { type: Boolean },
            process: { type: String, default: '' },
            voice: { type: Number, default: 0 },
            rewards: {
                money: { type: Number, default: 0 },
                gem: { type: Number, default: 0 },
                items: [{ id: { type: String, default: '' }, amount: { type: Number, default: 0 } }]
            }
        }],
        //Inventory
        inv: [{
            id: { type: String, default: '' },
            type: { type: String, default: '' },
            amount: { type: Number, default: 0 }
        }],
        //Cooldown
        cooldown: {
            crate: { type: Boolean, default: false },
            rela_paper: { type: Number, default: 0 },
            commands: { type: Schema.Types.Mixed, default: {} },
            interaction: { type: Number, default: 0 }
        },
        //Discount
        discount: {
            ticket: [{ type: String, default: '' }],
            gem: [{ type: String, default: '' }]
        },
        //Appellation
        appellation: {
            icon: { type: String, default: 'i00' },
            label: { type: String, default: 'd00' },
            lastTime: { type: Number, default: 0 }
        },
        //Daily
        daily: {
            reroll: {
                today: { type: Number, default: 0 },
                free: { type: Number, default: 1 },
                fee: { type: Number, default: 5 }
            },
            today: { type: Boolean, default: false },
            level: { type: Number, default: 1 },
            total: { type: Number, default: 0 },
            streak: { type: Number, default: 0 },
            gained: { type: Number, default: 0 },
            limit: {
                quest: { type: Number, default: 3 },
                money: { type: Number, default: 2000 }
            },
            temp: {
                status: { type: Boolean, default: false },
                id: { type: String, default: '' },
                limit: {
                    quest: { type: Number, default: 0 },
                    money: { type: Number, default: 0 }
                }
            }
        },
        //Weekly
        weekly: {
            total: { type: Number, default: 0 }
        },
        //Giftcode
        giftcode: { type: Schema.Types.Mixed, default: {} },
        thptqg: { type: String }
    }, { strict: true });

    return connection.model('users', UserSchema)
}