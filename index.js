// NODE MODULES
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mg = require("mailgun-js");
const { createClient } = require("@supabase/supabase-js");

// SERVER VARIABLES
const app = express();
const PORT = process.env.PORT || 9000;
const rootEmail = "adrianpearman12@gmail.com";
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
// Get wedding groups
const fetchGroup = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("guests")
      .select()
      .eq("group", req.query.id);

    if (error) {
      throw new Error(
        `Unable to find an Invitation of #${groupID}. Please enter a valid Invitation ID. If your ID is not working, please contact us`
      );
    }

    if (data.length === 0) {
      throw new Error(
        `Unable to find an Invitation of #${groupID}. Please enter a valid Invitation ID. If your ID is not working, please contact us`
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

  const emailInfo = {
    from: "Excited User <mailgun@sandbox-123.mailgun.org>",
    to: data,
    subject: "Thanks for your RSVP!",
    html: "<h1>Testing some Mailgun awesomeness!</h1>",
  };

  // TODO: Figure out email body content and how to attach content to it
  // add to calendar
  // Visit Amy & William's Wedding Website any time to update your RSVP and check details about the big day!
  // link back to the home page

  mailgun()
    .messages()
    .send(emailInfo, (error, body) => {
      if (error) {
        console.log(error);
        res.status(500).send({
          msg: "Something went wrong when sending the email",
        });
      } else {
        res.send({ msg: "Email sent successfully! " });
      }
    });
};

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
// Get the groups
app.get("/api/group", fetchGroup);
// Updating the guest
app.put("/api/update", updateGroup);
// Sending the confirmation email
app.post("/api/email", sendMail);
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
