const svgCaptcha = require('svg-captcha');
const {Helper, Exception, StringHelper} = global.kernel.helpers;

import CaptchaSchema from "./captcha-schema"

export default class Captcha{

    constructor(scope) {
        this._scope = scope;
    }

    async createCaptcha(){

        const captcha = svgCaptcha.create({
            noise: 6,
            color: true,
            size: this._scope.argv.captcha.size,
        });

        const date = Math.floor( new Date().getTime() / 1000 );

        const message = {
            v: 0,
            text: captcha.text,
            id: StringHelper.generateRandomId(32),
            date,
        };

        const encrypted = await this._scope.cryptography.cryptoSignature.encrypt( JSON.stringify(message), this._scope.argv.captcha.publicKey );

        return ({

            captcha: {
                size: this._scope.argv.captcha.size,
                date,
                data: captcha.data,
                encryption: encrypted.toString("hex"),
            },

        });


    }

    async solveCaptcha(solution, encryption){

        solution = StringHelper.sanitizeText(solution);

        const dataBuffer = await this._scope.cryptography.cryptoSignature.decrypt( encryption, this._scope.argv.captcha.publicKey );
        if (!dataBuffer)
            throw new Exception(this, "Decryption couldn't be done");

        const out = dataBuffer.toString("ascii");
        const data = JSON.parse(out);

        if (data.date - new Date().getTime()/1000  > this._scope.argv.captcha.expireCaptcha)
            throw new Exception(this, "Captcha expired");

        if ( solution !== data.text )
            throw new Exception(this, "Captcha is incorrect");

        const model = new CaptchaSchema(this._scope);
        model.id = data.id.toString("hex");
        model.date = data.date;

        if (await schema.exists())
            throw new Exception(this, "Captcha already used");

        return true;

    }

}