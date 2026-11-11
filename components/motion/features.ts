// Motion's DOM animation features, loaded as a separate chunk after the page has started (see MotionProvider),
// so the code that runs before the first screen is painted stays small.
import { domAnimation } from "motion/react";

export default domAnimation;
