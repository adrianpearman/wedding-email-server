// NODE MODULES
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const mailcomposer = require("mailcomposer");
const path = require("path");
// UTIL FUCNTIONS
const { convertToUnix, mailgun, supabase } = require("./util");
// SERVER VARIABLES
const app = express();
const PORT = process.env.PORT || 9000;

// FUNCTIONS
// Fetch and stringify email template
const importHTMLForEmail = () => {
  const emailPath = require("path").join(__dirname, "./emails");
  const emailText = fs.readFileSync(`${emailPath}/index.html`, "utf8");
  return emailText;
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
  const errorHTML = path.join(__dirname, "public", "error.html");
  const indexHTML = path.join(__dirname, "public", "index.html");

  try {
    // Throw error if no credentials
    if (req.query.pwd !== process.env.ANALYTIC_SECRET) {
      throw new Error("Unauthorized to view details");
    }

    res.sendFile(indexHTML);
  } catch (error) {
    res.sendFile(errorHTML);
  }
};
const guestAnalyticsData = async (req, res) => {
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
app.use(express.static(path.join(__dirname, "public")));
// ROUTES
// Get the groups
app.get("/api/group", fetchGroup);
// Guest Analytics
app.get("/analytics", guestAnalytics);
app.get("/api/analytics/", guestAnalyticsData);
// Updating the guest
app.put("/api/update", updateGroup);
// Sending the confirmation email
app.post("/api/email", sendMail);
// Server listening on the specific PORT
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
