import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

const makeTwilioCall = async (phone) => {
  // console.log(phone);

  try {
    client.calls
      .create({
        url: "http://demo.twilio.com/docs/voice.xml",
        to: phone,
        from: "+16602181681",
      })
      .then((call) => console.log(call.sid));
  } catch (error) {
    console.error("Unable to setup call : ", error);
  }
};

export { makeTwilioCall };
