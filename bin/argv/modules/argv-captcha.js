export default {

    size: 8,

    expireCaptcha: 1*60*60,

    privateKey: Buffer.from("e9e42d28ecec38726ebdf3337415306552300ded3bf7058fb1a5a6326cf8e51b", "hex"), //it is used for captcha and it should be secret
    publicKey: Buffer.from("038d6ac60175b557ea2ab8f5651a698b84365c93f1e063d09d108d780960633f69", "hex"), //it is used for captcha and it should be secret

}