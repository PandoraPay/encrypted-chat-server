const {Helper, Exception, StringHelper} = global.kernel.helpers;
const {DBSchema} = global.kernel.marshal.db;

import captcha from "captcha"
import CaptchaSchema from "./captcha-schema"

export default class Captcha{

    constructor(scope) {
        this._scope = scope;

        this.dataSubscription = new DBSchema(this._scope);
        this._init = false;

    }

    async initializeCaptcha(){

        if ( this._init ) return true;


        this._init = true;
        return true;

    }

    async createCaptcha(){

        const { token, buffer } = await captcha({size: this._scope.argv.captcha.size});

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
            expire: this._scope.argv.captcha.expireCaptcha,
            data: `data:image/gif;base64,${buffer.toString('base64')}`,
            encryption: encrypted.toString("hex"),
        });


    }

    async solveCaptcha({solution, encryption}){

        if (!solution && !encryption) throw new Exception(this, "Captcha is missing");

        if ( typeof solution !== "string") throw new Exception(this, "Solution is not a string");
        if ( typeof encryption !== "string") throw new Exception(this, "Encryption is not a string");

        solution = StringHelper.sanitizeText(solution);

        const dataBuffer = await this._scope.cryptography.cryptoSignature.decrypt( encryption, this._scope.argv.captcha.privateKey );
        if (!dataBuffer)
            throw new Exception(this, "Decryption couldn't be done");

        const out = dataBuffer.toString("ascii");
        const data = JSON.parse(out);

        if ( new Date().getTime()/1000 - data.date > this._scope.argv.captcha.expireCaptcha)
            throw new Exception(this, "Captcha expired");

        const model = new CaptchaSchema(this._scope);
        model.id = data.id.toString("hex");
        model.date = data.date;

        if (await model.exists())
            throw new Exception(this, "Captcha already used");

        await model.save();

        if ( solution !== data.text )
            throw new Exception(this, "Captcha is incorrect");

        return true;

    }

}