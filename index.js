// NODE MODULES
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const mailcomposer = require("mailcomposer");
const mg = require("mailgun-js");
const { createClient } = require("@supabase/supabase-js");
// SERVER VARIABLES
const app = express();
const PORT = process.env.PORT || 9000;
// DB Initialization
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
// MAILGUN CREDENTIALS
const credentials = {
  domain: process.env.MAILGUN_DOMAIN,
  apiKey: process.env.MAILGUN_APIKEY,
};
// Mailgun Initialization
const mailgun = () => {
  return mg(credentials);
};
// FUNCTIONS
// Fetch and stringify email template
const importHTMLForEmail = () => {
  const emailPath = require("path").join(__dirname, "./emails");
  const emailText = fs.readFileSync(`${emailPath}/index.html`, "utf8");
  return emailText;
};
// Convert response date to unix
const convertToUnix = (date) => {
  const responseDate = new Date(date);
  return Math.floor(responseDate.getTime() / 1000);
};
// Get wedding groups
const fetchGroup = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("guests")
      .select()
      .eq("group", req.query.id);

    if (error || data.length === 0) {
      throw new Error(
        `Unable to find an Invitation of #${req.query.id}. Please enter a valid Invitation ID. If your ID is not working, please contact us`
      );
    }

    if (data.length > 0) {
      res.send({ data: data });
    }
  } catch (error) {
    res.status(404).send({
      data: false,
      msg: error.message,
    });
  }
};
// Update groups with response
const updateGroup = async (req, res) => {
  const { data, id } = req.body;

  try {
    const { error } = await supabase.from("guests").update(data).eq("id", id);
    if (error) {
      throw new Error();
    }

    res.send({
      success: true,
    });
  } catch (error) {
    res.status(404).send({
      success: false,
    });
  }
};
// Send confirmation email
const sendMail = async (req, res) => {
  const { data } = req.body;
  const emailData = await importHTMLForEmail();

  const mail = mailcomposer({
    from: "The Pearmans <thepearmanwedding@gmail.com>",
    to: data,
    subject: "Thanks for your RSVP!",
    html: emailData,
  });

  mail.build((err, message) => {
    const dataToSend = {
      to: data,
      message: message.toString("ascii"),
    };

    mailgun()
      .messages()
      .sendMime(dataToSend, (error, body) => {
        if (error) {
          res.status(500).send({
            msg: "Something went wrong when sending the email, please try again or contact us",
            success: false,
          });
        } else {
          res.send({
            msg: "Email sent successfully! ",
            success: true,
          });
        }
      });
  });
};
// Guest Analytics
const guestAnalytics = async (req, res) => {
  try {
    // Throw error if no credentials
    if (req.query.pwd !== process.env.ANALYTIC_SECRET) {
      throw new Error("Unauthorized to view details");
    }
    // Destructuring data from supabase
    const { data, error } = await supabase.from("guests").select();
    // Throw error if supabase is not available
    if (error) {
      throw new Error(
        "Can't get guest analytics at this time. Try again later.."
      );
    }
    // Guests coming
    const confirmedGuests = data
      .filter(({ response_going }) => response_going === true)
      .sort(
        (x, y) =>
          convertToUnix(x.response_date) - convertToUnix(y.response_date)
      )
      .reverse();
    // Guests not coming
    const notComingGuests = data
      .filter(({ response_going }) => response_going === false)
      .sort(
        (x, y) =>
          convertToUnix(x.response_date) - convertToUnix(y.response_date)
      )
      .reverse();
    // Guests not confirmed
    const unconformedGuests = data.filter(
      ({ response_going }) => response_going === null
    );
    // Analytics object
    const analytics = {
      guestsResponded: confirmedGuests.length + notComingGuests.length,
      totalGuestsComing: confirmedGuests.length,
      totalGuestsNotComing: notComingGuests.length,
      totalGuests: data.length,
      confirmedGuests,
      notComingGuests,
      unconformedGuests,
    };
    // Sending data through response object
    res.send({
      data: analytics,
      msg: "",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      data: {},
      msg: error.message,
      success: false,
    });
  }
};
// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ROUTES
// Get the groups
app.get("/api/group", fetchGroup);
// Guest Analytics
app.get("/api/analytics", guestAnalytics);
// Updating the guest
app.put("/api/update", updateGroup);
// Sending the confirmation email
app.post("/api/email", sendMail);
// Server listening on the specific PORT
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
