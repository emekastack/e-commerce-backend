import { V4 } from "paseto";

const generateKeyPair = async () => {
    const keyPair = await V4.generateKey("public", { format: "paserk" });

    return {
        privateKey: keyPair.secretKey, 
        publicKey: keyPair.publicKey
    };
};
 generateKeyPair().then(result => {
    console.log("Private Key:", result.privateKey);
    console.log("Public Key:", result.publicKey);
});