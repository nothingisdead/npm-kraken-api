const KrakenClient = require('../../kraken.js')

describe('KrakenClient', async ()=>{
    it('[Constructor] null param', ()=>{
        try{ new KrakenClient() }
        catch (e) {
            expect(e.message).toBe('[Error] null key or secret')
        }
    })

    it('[Constructor]', ()=>{
        const key = 'mockKey'
        const secret = 'mockSecret'
        const kc = new KrakenClient(key, secret)
        const reqConfig = require('../../config/request.json')

        expect(kc.config).toEqual({
            ...reqConfig,
            key,
            secret
        })
    })

})