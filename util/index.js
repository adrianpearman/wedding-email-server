// NPM Modules
const mg = require("mailgun-js");
const { createClient } = require("@supabase/supabase-js");

module.exports = {
  // Convert response date to unix
  convertToUnix: (date) => {
    const responseDate = new Date(date);
    return Math.floor(responseDate.getTime() / 1000);
  },
  // Mailgun Initialization
  mailgun: () => {
    return mg({
      domain: process.env.MAILGUN_DOMAIN,
      apiKey: process.env.MAILGUN_APIKEY,
    });
  },
  // DB Initialization
  supabase: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY),
};
