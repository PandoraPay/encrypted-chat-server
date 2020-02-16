const {Helper, Exception, StringHelper} = global.kernel.helpers;

import captcha from "captcha"
import CaptchaSchema from "./captcha-schema"

export default class Captcha{

    constructor(scope) {
        this._scope = scope;
    }

    async createCaptcha(){

        const { token, buffer } = await captcha({size: this._scope.argv.captcha.size})

        const date = Math.floor( new Date().getTime() / 1000 );

        const message = {
            v: 0,
            text: token,
            id: StringHelper.generateRandomId(32),
            date,
        };

        const encrypted = await this._scope.cryptography.cryptoSignature.encrypt( JSON.stringify(message), this._scope.argv.captcha.publicKey );

        return ({
            size: this._scope.argv.captcha.size,
            date,
            data: `data:image/gif;base64,${buffer.toString('base64')}`,
            encryption: encrypted.toString("hex"),
        });


    }

    async solveCaptcha({solution, encryption}){

        if (!solution && !encryption) throw new Exception(this, "Captcha is missing");

        if ( typeof solution === "string") throw new Exception(this, "Solution is not a string");
        if ( typeof encryption === "string") throw new Exception(this, "Encryption is not a string");

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