import Stripe from "stripe";
import { envVars } from "./env";

export const string = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY);
