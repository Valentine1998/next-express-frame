const express = require("express");
const next = require("next");
const session = require("express-session");
const logger = require("morgan");
// const expressValidator = require("express-validator");
const passport = require("passport");
const helmet = require("helmet");
const compression = require("compression");
var PostgreSqlStore = require("connect-pg-simple")(session);
const models = require("./models");

// Loads all variables from .env file to "process.ev"
require("dotenv").config();

// Connecting to Sequelize models connected to PostgresQL database across the whole app
require("./models");

// Require routes to help order code and keep it clean
const routes = require("./routes");
require("./passport");

// If app is in dev use PORT 3000. Else use process.env.PORT
const dev = process.env.NODE_ENV != "production";
const port = process.env.PORT || 3000;
const ROOT_URL = dev ? `http:localhost:${port}` : process.env.PRODUCTION_URL;

const app = next({ dev });
// Will be delegating all real jobs to Next.js
const handle = app.getRequestHandler();

app.prepare()
   .then(() => {
      const server = express();

      //Sync Database after start of server
      models.sequelize
         .sync()
         .then(() => {
            console.log("Postgres DB started and synced");
         })
         .catch(err => {
            console.log(err);
         });

      if (!dev) {
         // Helmet helps secure our app by setting headers
         server.use(helmet());

         // Compression gives us gzip compression.  Makes the size of the files getting transferred much smaller!
         server.use(compression());
      }
      // Body Parser built-in to Express now.  Just need to Json Parser
      server.use(express.json());

      // Express Validatior will validate form data sent to the backend
      // server.use(expressValidator()) deprecated

      // All next requests given to Next
      server.get("/_next/*", (req, res) => {
         handle(req, res);
      });

      server.get("/static/*", (req, res) => {
         handle(req, res);
      });

      // Sets up sessions with Postgres
      /* You must create a table within your postgres database.  This table must be named "session" (unless specified in the options below).
      Configuration of this table can be found in node_modules/connect-pg-simple/table.sql  
   */
      const sessionConfig = {
         secret: process.env.COOKIE_SECRET,
         resave: false, // Don't save unmodified sessions
         saveUninitialized: true,
         store: new PostgreSqlStore({
            /*
            connection string is built by following the syntax:
            postgres://USERNAME:PASSWORD@HOST_NAME:PORT/DB_NAME
            */
            conString: process.env.POSTGRES_URI
         }),
         cookie: {
            cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // Cookie expires in 14 days
         }
      };

      if (!dev) {
         session.Config.cookie.secure = true; // Serve secure cookies in production enviroment
         server.set("trust proxy", 1); // Trust first proxy
      }

      // Apply our session configuration to express-session
      server.use(session(sessionConfig));

      // Add passport middleware to set passport up
      server.use(passport.initialize());
      server.use(passport.session());

      server.use((req, res, next) => {
         // Custom middleware to put our user data (from passport) on the req.user so we can access it as such anywhere in our app
         res.locals.user = req.user || null;
         next();
      });

      // Morgan for request logging from client
      // Skip to ignore static files from _folder
      server.use(
         logger("dev", {
            skip: req => req.url.includes("_next")
         })
      );

      // Apply routes from the "routes" folder
      server.use("/", routes);

      // Error handling from async / await funtions
      server.use((err, req, res, next) => {
         const { status = 500, message } = err;
         res.status(status).json(message);
      });

      server.get("*", (req, res) => {
         handle(req, res);
      });

      server.listen(port, err => {
         if (err) throw err;
         console.log(`Server listening on ${ROOT_URL}`);
      });
   })
   .catch(function(ex) {
      console.error(ex.stack);
      process.exit(1);
   });
