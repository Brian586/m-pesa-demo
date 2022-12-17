const express = require('express');

let unirest = require('unirest');

const bodyParser = require('body-parser');

var moment = require('moment');

const app = express();

app.listen(3000);

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));

// Set your app credentials
const credentials = {
    apiKey: '4c48159e8b6c6b88682f0686f347e54345f7c818964240d822f2ced4aa3980d4',
    username: 'Scof02',
}

// Initialize the SDK
const AfricasTalking = require('africastalking')(credentials);

// Get the airtime service
const airtime = AfricasTalking.AIRTIME;


let consumerKey = 'JMpOMMbnWeP3gQ8B4groBaa1eyNiBoGk';
let consumerSecret = 'sfdba0g1fuwyvKBy';


app.get("/", (req, res)=> {
    res.sendFile("./index.html", { root: __dirname });
});

app.post("/", async function(req, res) {
    var phoneFrom = req.body.phoneFrom;
    var amount = req.body.amount;
    var phoneTo = req.body.phoneTo;
    var code = req.body.code;
    //var status = '';

    if(phoneFrom !== "" && amount !== "" && phoneTo !== "" ) {

        var newAmount = 1.2 * parseInt(amount);
        
        // Initiate sending money 
        sendMoney(phoneFrom, amount);

        //status = await sendAirtime(phoneTo, newAmount, code);
    }

    res.send("Status: Done");

    res.end();
});

async function sendAirtime(phone, amount, code) {
    const options = {
        recipients: [{
            phoneNumber: phone,
            currencyCode: code,
            amount: amount
        }]
    };

    var status = '';

    // That’s it hit send and we’ll take care of the rest
    await airtime.send(options)
        .then(response => {
            console.log(response);
            
            if(response.numSent === 1) {
                status = "Sent Successfully!";
            }else {
                status = "Failed to send Airtime";
            }

        }).catch(error => {
            console.log(error);

            status = 'Error: '+error;
        });

        return status;
}

function getBase64Encode(data) {
    let keySecretData = `${data}`;
    let buff = new Buffer(keySecretData);
    let basicAuth = buff.toString('base64');

    return basicAuth;
}


function getTimestamp() {
    const d_t = new Date();
 
    let year = d_t.getFullYear();
    let month = ("0" + (d_t.getMonth() + 1)).slice(-2);
    let day = ("0" + d_t.getDate()).slice(-2);
    let hour = d_t.getHours();
    let minute = d_t.getMinutes();
    let seconds = d_t.getSeconds();

    return year+month+day+hour+minute+seconds;
}

async function sendMoney(phone, amount) {

    let basicAuth = getBase64Encode(`${consumerKey}:${consumerSecret}`);


    await unirest('GET', 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials')
        .headers({ 'Authorization': `Basic ${basicAuth}` })
        .send()
        .end(res => {

            var accessToken = res.body.access_token;

            var timestamp = moment().format("YYYYMMDDHHmmss");//YYYYMMDDHHmmss

            var password = getBase64Encode(174379+'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'+timestamp);


     unirest('POST', 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest')
        .headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        })
        .send(JSON.stringify({
            "BusinessShortCode": 174379,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": parseInt(amount),
            "PartyA": parseInt(phone),
            "PartyB": 174379,
            "PhoneNumber": parseInt(phone),
            "CallBackURL": "https://us-central1-m-pesa-demo.cloudfunctions.net/callback",
            "AccountReference": "REISLY",
            "TransactionDesc": "Payment of Rent" 
        }))
        .end(response2 => {

            if(response2.body.ResponseCode === '0'){
                console.log('Pending Payment');
            }
            
        });
            
        });

        
}