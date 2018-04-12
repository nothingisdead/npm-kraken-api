const {getMessageSignature} = require('../../lib/signature')

describe('KrakenClient', async ()=>{
    it('[Constructor] null param', ()=>{
        const path = '/mock/path'
        const request = {mock:'foo'}
        const secret = 'mockSecret'
        const nonce = 'mockNonce'
        const result = getMessageSignature(path, request, secret, nonce)

        expect(result).toBe('VP8viIhM4IDc0gOPRN4oyDqyBr5/f/rSWMMt/NGjwlq9NcmcSnZESpQ1aT4lETVzmyfzUbR6cIi8+2V1wTWtlQ==')
    })
})