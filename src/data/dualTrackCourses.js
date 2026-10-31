/**
 * SignVerse Dual-Track Curriculum Data
 * Track 1: Text-to-Sign (3D Avatar WebGL) - 15 Modules
 * Track 2: Sign-to-Text (Live Camera AI) - 15 Modules
 * Freemium Rule: Modules 1 to 5 are FREE (isLocked: false). Modules 6 onwards are PRO (isLocked: true).
 */

export const TEXT_TO_SIGN_TRACK = [
  {
    id: 'tts-mod-1',
    number: 1,
    title: 'Alphabets & Fingerspelling Basics',
    subtitle: 'A to E manual fingerspelling foundations',
    description: 'Learn foundational letter signs A, B, C, D, and E with our real-time 3D Avatar Luna.',
    tier: 'Free',
    isLocked: false,
    duration: '15 mins',
    xp: 150,
    accentColor: '#10b981',
    icon: '🔤',
    targetWords: ['A', 'B', 'C', 'D', 'E'],
    lessons: [
      { id: 'tts-l1-1', title: 'Letter A: Compact Fist', word: 'A', sigml: 'SignFiles/A.sigml', duration: '3 mins', xp: 30, phonetic: '/eɪ/', summary: 'Closed fist with thumb resting alongside index finger.', handShape: 'Fist with thumb upright on side.', isLocked: false },
      { id: 'tts-l1-2', title: 'Letter B: Flat Four Hand', word: 'B', sigml: 'SignFiles/B.sigml', duration: '3 mins', xp: 30, phonetic: '/biː/', summary: 'All 4 fingers straight up, thumb tucked across palm.', handShape: 'Flat 4 fingers with thumb tucked.', isLocked: false },
      { id: 'tts-l1-3', title: 'Letter C: Curved Arc Hand', word: 'C', sigml: 'SignFiles/C.sigml', duration: '3 mins', xp: 30, phonetic: '/siː/', summary: 'Curved C shape formed by fingers and opposing thumb.', handShape: 'Cupped C arc.', isLocked: false },
      { id: 'tts-l1-4', title: 'Letter D: Single Index Point', word: 'D', sigml: 'SignFiles/D.sigml', duration: '3 mins', xp: 30, phonetic: '/diː/', summary: 'Index pointing straight up while thumb touches middle finger tip.', handShape: 'Index up, other 3 curled.', isLocked: false },
      { id: 'tts-l1-5', title: 'Letter E: Claw Curl Hand', word: 'E', sigml: 'SignFiles/E.sigml', duration: '3 mins', xp: 30, phonetic: '/iː/', summary: 'Fingers curled inward resting on top of the thumb.', handShape: 'Tight claw-curl.', isLocked: false }
    ]
  },
  {
    id: 'tts-mod-2',
    number: 2,
    title: 'Everyday Basics & Greetings',
    subtitle: 'Universal introductions & polite courtesies',
    description: 'Master core social opening phrases: Hello, Thank You, Name, and Please in fluid 3D WebGL.',
    tier: 'Free',
    isLocked: false,
    duration: '18 mins',
    xp: 200,
    accentColor: '#10b981',
    icon: '👋',
    targetWords: ['Hello', 'Thank You', 'Name', 'Please'],
    lessons: [
      { id: 'tts-l2-1', title: 'The Universal Hello', word: 'HELLO', sigml: 'SignFiles/hello.sigml', duration: '4 mins', xp: 50, phonetic: '/həˈloʊ/', summary: 'Dominant hand salutes outwards from temple with direct eye contact.', handShape: 'Open B-Hand.', isLocked: false },
      { id: 'tts-l2-2', title: 'Heartfelt Gratitude', word: 'THANK YOU', sigml: 'SignFiles/thankyou.sigml', duration: '4 mins', xp: 50, phonetic: '/θæŋk juː/', summary: 'Fingertips touch chin and extend gently forward toward recipient.', handShape: 'Flat palm outwards.', isLocked: false },
      { id: 'tts-l2-3', title: 'Introducing Your Name', word: 'NAME', sigml: 'SignFiles/namewhat.sigml', duration: '5 mins', xp: 50, phonetic: '/neɪm/', summary: 'Two-handed H-finger crossing and tapping gently at knuckles.', handShape: 'Dual H/U handshapes.', isLocked: false },
      { id: 'tts-l2-4', title: 'Courteous Requests', word: 'PLEASE', sigml: 'SignFiles/please.sigml', duration: '5 mins', xp: 50, phonetic: '/pliːz/', summary: 'Open palm rubbing in clockwise circles over the center chest.', handShape: 'Flat chest circle.', isLocked: false }
    ]
  },
  {
    id: 'tts-mod-3',
    number: 3,
    title: 'Numbers & Numerical Counting',
    subtitle: 'Quantities 1 through 5 with directional orientation',
    description: 'Accurate digit positioning for quantities, prices, and counting gestures.',
    tier: 'Free',
    isLocked: false,
    duration: '16 mins',
    xp: 220,
    accentColor: '#10b981',
    icon: '🔢',
    targetWords: ['One', 'Two', 'Three', 'Four', 'Five'],
    lessons: [
      { id: 'tts-l3-1', title: 'Number 1: Index Point', word: 'ONE', sigml: 'SignFiles/1.sigml', duration: '3 mins', xp: 40, phonetic: '/wʌn/', summary: 'Index finger pointing upward with palm facing inward.', handShape: 'Single index.', isLocked: false },
      { id: 'tts-l3-2', title: 'Number 2: Index & Middle', word: 'TWO', sigml: 'SignFiles/2.sigml', duration: '3 mins', xp: 40, phonetic: '/tuː/', summary: 'Index and middle fingers extended upward in parallel.', handShape: 'V-shape upward.', isLocked: false },
      { id: 'tts-l3-3', title: 'Number 3: Thumb, Index, Middle', word: 'THREE', sigml: 'SignFiles/3.sigml', duration: '3 mins', xp: 40, phonetic: '/θriː/', summary: 'Thumb, index, and middle extended outward in ASL/ISL format.', handShape: '3-prong fork.', isLocked: false },
      { id: 'tts-l3-4', title: 'Number 4: Four Fingers Flat', word: 'FOUR', sigml: 'SignFiles/4.sigml', duration: '3 mins', xp: 50, phonetic: '/fɔːr/', summary: 'Four fingers up, thumb folded across palm.', handShape: 'Flat 4 digits.', isLocked: false },
      { id: 'tts-l3-5', title: 'Number 5: Full Open Hand', word: 'FIVE', sigml: 'SignFiles/5.sigml', duration: '4 mins', xp: 50, phonetic: '/faɪv/', summary: 'All 5 digits splayed open comfortably toward conversational partner.', handShape: 'Open 5.', isLocked: false }
    ]
  },
  {
    id: 'tts-mod-4',
    number: 4,
    title: 'Food, Fruits & Kitchen Staples',
    subtitle: 'Daily meals, orchard fruits & beverages',
    description: 'Learn delicious food signs: Apple, Banana, Food, and Tea with cheek twists and peeling motions.',
    tier: 'Free',
    isLocked: false,
    duration: '20 mins',
    xp: 260,
    accentColor: '#10b981',
    icon: '🍎',
    targetWords: ['Apple', 'Banana', 'Food', 'Tea'],
    lessons: [
      { id: 'tts-l4-1', title: 'Ordering Crisp Apples', word: 'APPLE', sigml: 'SignFiles/apple.sigml', duration: '5 mins', xp: 65, phonetic: '/ˈæp.əl/', summary: 'Curled index knuckle rotating gently against cheek near mouth.', handShape: 'Bent X knuckle.', isLocked: false },
      { id: 'tts-l4-2', title: 'Peeling Fresh Bananas', word: 'BANANA', sigml: 'SignFiles/banana.sigml', duration: '5 mins', xp: 65, phonetic: '/bəˈnæn.ə/', summary: 'Non-dominant index stands upright while dominant hand peels down twice.', handShape: 'Peeling hand.', isLocked: false },
      { id: 'tts-l4-3', title: 'Daily Meals & Food', word: 'FOOD', sigml: 'SignFiles/fruit.sigml', duration: '5 mins', xp: 65, phonetic: '/fuːd/', summary: 'Flattened O-hand tapping twice toward lips.', handShape: 'Tapered O to mouth.', isLocked: false },
      { id: 'tts-l4-4', title: 'Steaming Hot Tea', word: 'TEA', sigml: 'SignFiles/tea.sigml', duration: '5 mins', xp: 65, phonetic: '/tiː/', summary: 'Stirring tea leaves or dipping teabag into cup.', handShape: 'O-hand dipping.', isLocked: false }
    ]
  },
  {
    id: 'tts-mod-5',
    number: 5,
    title: 'Emotions & Facial Expressions',
    subtitle: 'Conveying feelings & non-manual markers',
    description: 'Express emotions clearly with animated face-body harmony: Happy, Sad, Angry, and Excited.',
    tier: 'Free',
    isLocked: false,
    duration: '22 mins',
    xp: 300,
    accentColor: '#10b981',
    icon: '😊',
    targetWords: ['Happy', 'Sad', 'Angry', 'Excited'],
    lessons: [
      { id: 'tts-l5-1', title: 'Radiant Joy (Happy)', word: 'HAPPY', sigml: 'SignFiles/happy.sigml', duration: '5 mins', xp: 75, phonetic: '/ˈhæp.i/', summary: 'Open hands sweeping upwards repeatedly off the chest with wide smile.', handShape: 'Dual upward sweeps.', isLocked: false },
      { id: 'tts-l5-2', title: 'Melancholy (Sad)', word: 'SAD', sigml: 'SignFiles/sad.sigml', duration: '5 mins', xp: 75, phonetic: '/sæd/', summary: 'Open hands dropping down the face accompanied by lowered eyelids.', handShape: 'Drooping palms.', isLocked: false },
      { id: 'tts-l5-3', title: 'Frustration (Angry)', word: 'ANGRY', sigml: 'SignFiles/angry.sigml', duration: '6 mins', xp: 75, phonetic: '/ˈæŋ.ɡri/', summary: 'Clawed hand pulling away sharply from face with furrowed brows.', handShape: 'Clawed claw.', isLocked: false },
      { id: 'tts-l5-4', title: 'High Energy (Excited)', word: 'EXCITED', sigml: 'SignFiles/good.sigml', duration: '6 mins', xp: 75, phonetic: '/ɪkˈsaɪ.tɪd/', summary: 'Middle fingers alternately brushing up chest rapidly.', handShape: 'Alternate finger brush.', isLocked: false }
    ]
  },

  // ===================== PRO PAYWALL MODULES (6 TO 15) =====================
  {
    id: 'tts-mod-6',
    number: 6,
    title: 'Emergency, Safety & Medical Aid',
    subtitle: 'Critical safety signs for urgent care situations',
    description: 'Crucial life-saving signs for expressing distress, calling doctors, ambulances, and hospital staff.',
    tier: 'Pro',
    isLocked: true,
    duration: '25 mins',
    xp: 380,
    accentColor: '#10b981',
    icon: '🚨',
    targetWords: ['Help', 'Doctor', 'Hospital', 'Headache'],
    lessons: [
      { id: 'tts-l6-1', title: 'Calling for Assistance (Help)', word: 'HELP', sigml: 'SignFiles/help.sigml', duration: '6 mins', xp: 95, phonetic: '/hɛlp/', summary: 'Closed fist with thumb up resting on flat palm lifted upward.', handShape: 'Fist on base palm.', isLocked: true },
      { id: 'tts-l6-2', title: 'Medical Specialist (Doctor)', word: 'DOCTOR', sigml: 'SignFiles/ambulance.sigml', duration: '6 mins', xp: 95, phonetic: '/ˈdɒk.tər/', summary: 'Tapping fingers on inside of non-dominant wrist checking pulse.', handShape: 'Wrist pulse tap.', isLocked: true },
      { id: 'tts-l6-3', title: 'Emergency Room (Hospital)', word: 'HOSPITAL', sigml: 'SignFiles/alert.sigml', duration: '6 mins', xp: 95, phonetic: '/ˈhɒs.pɪ.təl/', summary: 'Drawing a cross on the upper arm with two fingers.', handShape: 'H-cross on shoulder.', isLocked: true },
      { id: 'tts-l6-4', title: 'Acute Pain (Headache)', word: 'HEADACHE', sigml: 'SignFiles/headache.sigml', duration: '7 mins', xp: 95, phonetic: '/ˈhɛd.eɪk/', summary: 'Index fingers pointing toward temples twisting back and forth.', handShape: 'Dual temple twist.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-7',
    number: 7,
    title: 'Relational Bonds & Family',
    subtitle: 'Kinship vocabulary & multi-hand dialogues',
    description: 'Express close family connections and social companionship: Mother, Father, Friend, and Brother.',
    tier: 'Pro',
    isLocked: true,
    duration: '24 mins',
    xp: 380,
    accentColor: '#10b981',
    icon: '👨‍👩‍👧',
    targetWords: ['Mother', 'Father', 'Friend', 'Brother'],
    lessons: [
      { id: 'tts-l7-1', title: 'Maternal Warmth (Mother)', word: 'MOTHER', sigml: 'SignFiles/mother.sigml', duration: '6 mins', xp: 95, phonetic: '/ˈmʌð.ər/', summary: 'Open 5-hand thumb tapping gently on chin.', handShape: 'Chin thumb tap.', isLocked: true },
      { id: 'tts-l7-2', title: 'Paternal Strength (Father)', word: 'FATHER', sigml: 'SignFiles/father.sigml', duration: '6 mins', xp: 95, phonetic: '/ˈfɑː.ðər/', summary: 'Open 5-hand thumb tapping gently on forehead.', handShape: 'Forehead thumb tap.', isLocked: true },
      { id: 'tts-l7-3', title: 'Lifelong Companions (Friend)', word: 'FRIEND', sigml: 'SignFiles/friend.sigml', duration: '6 mins', xp: 95, phonetic: '/frɛnd/', summary: 'Interlocking index finger hooks reversing position.', handShape: 'Interlocking hooks.', isLocked: true },
      { id: 'tts-l7-4', title: 'Male Sibling (Brother)', word: 'BROTHER', sigml: 'SignFiles/family.sigml', duration: '6 mins', xp: 95, phonetic: '/ˈbrʌð.ər/', summary: 'Forehead touch descending to join lower hand.', handShape: 'Two L-shapes.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-8',
    number: 8,
    title: 'Colors & Visual Descriptions',
    subtitle: 'Vibrant hues & shade differentiation',
    description: 'Color vocabulary: Red, Blue, Green, and Yellow for descriptive dialogues.',
    tier: 'Pro',
    isLocked: true,
    duration: '22 mins',
    xp: 350,
    accentColor: '#10b981',
    icon: '🎨',
    targetWords: ['Red', 'Blue', 'Green', 'Yellow'],
    lessons: [
      { id: 'tts-l8-1', title: 'Crimson Red', word: 'RED', sigml: 'SignFiles/red.sigml', duration: '5 mins', xp: 85, phonetic: '/rɛd/', summary: 'Index finger brushing down lips.', handShape: 'Lip brush.', isLocked: true },
      { id: 'tts-l8-2', title: 'Deep Ocean Blue', word: 'BLUE', sigml: 'SignFiles/blue.sigml', duration: '5 mins', xp: 85, phonetic: '/bluː/', summary: 'B-hand shaking side-to-side slightly.', handShape: 'B-hand twist.', isLocked: true },
      { id: 'tts-l8-3', title: 'Emerald Green', word: 'GREEN', sigml: 'SignFiles/green.sigml', duration: '6 mins', xp: 90, phonetic: '/ɡriːn/', summary: 'G-hand twisting forward near chest.', handShape: 'G-hand wrist twist.', isLocked: true },
      { id: 'tts-l8-4', title: 'Bright Sunlight Yellow', word: 'YELLOW', sigml: 'SignFiles/yellow.sigml', duration: '6 mins', xp: 90, phonetic: '/ˈjɛl.oʊ/', summary: 'Y-hand shaking side to side gently.', handShape: 'Y-hand rotation.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-9',
    number: 9,
    title: 'Daily Routine, Time & Scheduling',
    subtitle: 'Hours, daily rhythm & sequence markers',
    description: 'Master time-based dialogues: Morning, Night, Time, and Today for scheduling appointments.',
    tier: 'Pro',
    isLocked: true,
    duration: '25 mins',
    xp: 400,
    accentColor: '#10b981',
    icon: '⏰',
    targetWords: ['Morning', 'Night', 'Time', 'Today'],
    lessons: [
      { id: 'tts-l9-1', title: 'Sun Rising (Morning)', word: 'MORNING', sigml: 'SignFiles/goodmorning.sigml', duration: '6 mins', xp: 100, phonetic: '/ˈmɔːr.nɪŋ/', summary: 'Dominant arm rising up from inside non-dominant elbow like sunrise.', handShape: 'Rising sun palm.', isLocked: true },
      { id: 'tts-l9-2', title: 'Dusk Settling (Night)', word: 'NIGHT', sigml: 'SignFiles/goodnight.sigml', duration: '6 mins', xp: 100, phonetic: '/naɪt/', summary: 'Dominant wrist arching over non-dominant arm representing sunset.', handShape: 'Sunset hand.', isLocked: true },
      { id: 'tts-l9-3', title: 'Checking The Clock (Time)', word: 'TIME', sigml: 'SignFiles/time.sigml', duration: '6 mins', xp: 100, phonetic: '/taɪm/', summary: 'Index finger tapping the back of non-dominant wrist.', handShape: 'Wrist watch tap.', isLocked: true },
      { id: 'tts-l9-4', title: 'The Present Day (Today)', word: 'TODAY', sigml: 'SignFiles/today.sigml', duration: '7 mins', xp: 100, phonetic: '/təˈdeɪ/', summary: 'Both Y-hands moving downward twice in rhythm.', handShape: 'Dual Y drop.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-10',
    number: 10,
    title: 'Weather & Nature Elements',
    subtitle: 'Atmospheric conditions & climate signs',
    description: 'Express meteorology: Rain, Sun, Cold, and Hot with natural meteorological gestures.',
    tier: 'Pro',
    isLocked: true,
    duration: '22 mins',
    xp: 380,
    accentColor: '#10b981',
    icon: '⛅',
    targetWords: ['Rain', 'Sun', 'Cold', 'Hot'],
    lessons: [
      { id: 'tts-l10-1', title: 'Falling Drops (Rain)', word: 'RAIN', sigml: 'SignFiles/water.sigml', duration: '5 mins', xp: 95, phonetic: '/reɪn/', summary: 'Clawed hands drifting downward gently fluttering.', handShape: 'Descending rain fingers.', isLocked: true },
      { id: 'tts-l10-2', title: 'Radiant Heat (Sun)', word: 'SUN', sigml: 'SignFiles/today.sigml', duration: '5 mins', xp: 95, phonetic: '/sʌn/', summary: 'Index finger drawing circle in sky expanding into open rays.', handShape: 'Circle into sun ray.', isLocked: true },
      { id: 'tts-l10-3', title: 'Shivering Wind (Cold)', word: 'COLD', sigml: 'SignFiles/tea.sigml', duration: '6 mins', xp: 95, phonetic: '/koʊld/', summary: 'Both fists shivering against chest in winter chills.', handShape: 'Dual fist tremor.', isLocked: true },
      { id: 'tts-l10-4', title: 'Sweltering Warmth (Hot)', word: 'HOT', sigml: 'SignFiles/food.sigml', duration: '6 mins', xp: 95, phonetic: '/hɒt/', summary: 'Claw hand at mouth throwing heat away outward.', handShape: 'Mouth discard.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-11',
    number: 11,
    title: 'Shopping & Marketplace Transactions',
    subtitle: 'Stores, currency & purchasing conversations',
    description: 'Shop with confidence: Buy, Money, Price, and Store.',
    tier: 'Pro',
    isLocked: true,
    duration: '24 mins',
    xp: 400,
    accentColor: '#10b981',
    icon: '🛍️',
    targetWords: ['Buy', 'Money', 'Price', 'Store'],
    lessons: [
      { id: 'tts-l11-1', title: 'Exchanging Currency (Buy)', word: 'BUY', sigml: 'SignFiles/book.sigml', duration: '6 mins', xp: 100, phonetic: '/baɪ/', summary: 'Dominant hand handing cash off non-dominant palm.', handShape: 'Cash transfer.', isLocked: true },
      { id: 'tts-l11-2', title: 'Coins & Bills (Money)', word: 'MONEY', sigml: 'SignFiles/home.sigml', duration: '6 mins', xp: 100, phonetic: '/ˈmʌn.i/', summary: 'Flattened O-hand tapping base palm twice.', handShape: 'Dollar stack tap.', isLocked: true },
      { id: 'tts-l11-3', title: 'Tag Cost (Price)', word: 'PRICE', sigml: 'SignFiles/school.sigml', duration: '6 mins', xp: 100, phonetic: '/praɪs/', summary: 'Crooked index brushing against palm upwards.', handShape: 'Index slice.', isLocked: true },
      { id: 'tts-l11-4', title: 'Marketplace Boutique (Store)', word: 'STORE', sigml: 'SignFiles/welcome.sigml', duration: '6 mins', xp: 100, phonetic: '/stɔːr/', summary: 'Both tapered hands swinging out from wrists.', handShape: 'Awning swing.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-12',
    number: 12,
    title: 'Workplace & Professional Dialogues',
    subtitle: 'Career, corporate meetings & digital emails',
    description: 'Navigate professional environments: Job, Office, Meeting, and Email.',
    tier: 'Pro',
    isLocked: true,
    duration: '26 mins',
    xp: 420,
    accentColor: '#10b981',
    icon: '💼',
    targetWords: ['Job', 'Office', 'Meeting', 'Email'],
    lessons: [
      { id: 'tts-l12-1', title: 'Career & Employment (Job)', word: 'JOB', sigml: 'SignFiles/tomorrow.sigml', duration: '6 mins', xp: 105, phonetic: '/dʒɒb/', summary: 'Fingerspelling J-O-B or wrist tapping work motion.', handShape: 'Dual fist work tap.', isLocked: true },
      { id: 'tts-l12-2', title: 'Headquarters (Office)', word: 'OFFICE', sigml: 'SignFiles/school.sigml', duration: '6 mins', xp: 105, phonetic: '/ˈɒf.ɪs/', summary: 'O-hands tracing building corners in space.', handShape: 'Dual O-corner.', isLocked: true },
      { id: 'tts-l12-3', title: 'Team Sync (Meeting)', word: 'MEETING', sigml: 'SignFiles/friend.sigml', duration: '7 mins', xp: 105, phonetic: '/ˈmiː.tɪŋ/', summary: 'Open hands coming together fingers touching like group gathering.', handShape: 'Assembly cluster.', isLocked: true },
      { id: 'tts-l12-4', title: 'Digital Dispatch (Email)', word: 'EMAIL', sigml: 'SignFiles/book.sigml', duration: '7 mins', xp: 105, phonetic: '/ˈiː.meɪl/', summary: 'Dominant index darting through curved C non-dominant hand.', handShape: 'Envelope feed.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-13',
    number: 13,
    title: 'Travel, Transit & Directions',
    subtitle: 'Vehicles, flight bookings & navigational guidance',
    description: 'Travel worldwide: Car, Train, Airplane, and Map.',
    tier: 'Pro',
    isLocked: true,
    duration: '26 mins',
    xp: 440,
    accentColor: '#10b981',
    icon: '✈️',
    targetWords: ['Car', 'Train', 'Airplane', 'Map'],
    lessons: [
      { id: 'tts-l13-1', title: 'Driving Steering (Car)', word: 'CAR', sigml: 'SignFiles/ambulance.sigml', duration: '6 mins', xp: 110, phonetic: '/kɑːr/', summary: 'Dual fists steering imaginary vehicle wheel.', handShape: 'Steering fists.', isLocked: true },
      { id: 'tts-l13-2', title: 'Railway Tracks (Train)', word: 'TRAIN', sigml: 'SignFiles/time.sigml', duration: '6 mins', xp: 110, phonetic: '/treɪn/', summary: 'Dual H-fingers sliding forward and backward across knuckles.', handShape: 'Parallel tracks.', isLocked: true },
      { id: 'tts-l13-3', title: 'Soaring Flight (Airplane)', word: 'AIRPLANE', sigml: 'SignFiles/welcome.sigml', duration: '7 mins', xp: 110, phonetic: '/ˈeər.pleɪn/', summary: 'ILY handshape swooping forward through the air.', handShape: 'Winged ILY glide.', isLocked: true },
      { id: 'tts-l13-4', title: 'Navigating Routes (Map)', word: 'MAP', sigml: 'SignFiles/book.sigml', duration: '7 mins', xp: 110, phonetic: '/mæp/', summary: 'M-hands unfolding imaginary paper blueprint.', handShape: 'Unfolding M-hands.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-14',
    number: 14,
    title: 'Questions, Clarifications & Inquiries',
    subtitle: 'WH-questions & conversational investigative signs',
    description: 'Ask inquisitive questions: Where, When, Who, and Why with eyebrow grammar.',
    tier: 'Pro',
    isLocked: true,
    duration: '25 mins',
    xp: 450,
    accentColor: '#10b981',
    icon: '❓',
    targetWords: ['Where', 'When', 'Who', 'Why'],
    lessons: [
      { id: 'tts-l14-1', title: 'Location Query (Where)', word: 'WHERE', sigml: 'SignFiles/howareyou.sigml', duration: '6 mins', xp: 110, phonetic: '/wɛər/', summary: 'Index finger oscillating side to side with furrowed brow.', handShape: 'Index wag.', isLocked: true },
      { id: 'tts-l14-2', title: 'Timeline Query (When)', word: 'WHEN', sigml: 'SignFiles/time.sigml', duration: '6 mins', xp: 110, phonetic: '/wɛn/', summary: 'Index circling around tip of non-dominant index then touching.', handShape: 'Clockwise orbit.', isLocked: true },
      { id: 'tts-l14-3', title: 'Identity Query (Who)', word: 'WHO', sigml: 'SignFiles/namewhat.sigml', duration: '6 mins', xp: 115, phonetic: '/huː/', summary: 'Thumb anchored on chin, index finger curling repeatedly.', handShape: 'Chin index curl.', isLocked: true },
      { id: 'tts-l14-4', title: 'Reasoning Query (Why)', word: 'WHY', sigml: 'SignFiles/help.sigml', duration: '7 mins', xp: 115, phonetic: '/waɪ/', summary: 'Touching forehead with flat hand pulling away into Y-handshape.', handShape: 'Forehead to Y.', isLocked: true }
    ]
  },
  {
    id: 'tts-mod-15',
    number: 15,
    title: 'Technology & Digital Hardware',
    subtitle: 'Smartphones, computing & internet platforms',
    description: 'Modern digital communication: Phone, Computer, Internet, and Screen.',
    tier: 'Pro',
    isLocked: true,
    duration: '28 mins',
    xp: 500,
    accentColor: '#10b981',
    icon: '💻',
    targetWords: ['Phone', 'Computer', 'Internet', 'Screen'],
    lessons: [
      { id: 'tts-l15-1', title: 'Handset Device (Phone)', word: 'PHONE', sigml: 'SignFiles/alert.sigml', duration: '7 mins', xp: 125, phonetic: '/foʊn/', summary: 'Y-hand thumb to ear, pinky to mouth.', handShape: 'Y-hand to ear.', isLocked: true },
      { id: 'tts-l15-2', title: 'Processing Rig (Computer)', word: 'COMPUTER', sigml: 'SignFiles/book.sigml', duration: '7 mins', xp: 125, phonetic: '/kəmˈpjuː.tər/', summary: 'C-hand bouncing upwards along non-dominant arm.', handShape: 'C-hand arm climb.', isLocked: true },
      { id: 'tts-l15-3', title: 'Global Web (Internet)', word: 'INTERNET', sigml: 'SignFiles/welcome.sigml', duration: '7 mins', xp: 125, phonetic: '/ˈɪn.tə.nɛt/', summary: 'Middle fingers rotating against each other at fingertips.', handShape: 'Interlinked fingertips.', isLocked: true },
      { id: 'tts-l15-4', title: 'Digital Display (Screen)', word: 'SCREEN', sigml: 'SignFiles/today.sigml', duration: '7 mins', xp: 125, phonetic: '/skriːn/', summary: 'Both index fingers outlining rectangular monitor border.', handShape: 'Rectangle outline.', isLocked: true }
    ]
  }
];

export const SIGN_TO_TEXT_TRACK = [
  {
    id: 'stt-mod-1',
    number: 1,
    title: 'Webcam Calibration & Hand Placement',
    subtitle: 'Optimal camera distance & affirmative Thumbs-Up pose',
    description: 'Learn to calibrate your camera frame and hold the core affirmation gesture "Yes" (Thumbs Up).',
    tier: 'Free',
    isLocked: false,
    duration: '12 mins',
    xp: 150,
    accentColor: '#10b981',
    icon: '📷',
    targetSigns: ['Yes (👍)'],
    drills: [
      { id: 'stt-d1-1', title: 'Drill 1: Thumbs-Up Affirmation (Yes)', gesture: 'Thumbs Up', target: 'Yes', duration: '4 mins', xp: 50, hint: 'Thumb pointing upright, 4 fingers folded tightly into palm.', isLocked: false },
      { id: 'stt-d1-2', title: 'Drill 2: Center-Frame Stability Hold', gesture: 'Thumbs Up', target: 'Yes', duration: '4 mins', xp: 50, hint: 'Hold hand at chest height for 3 unbroken seconds.', isLocked: false },
      { id: 'stt-d1-3', title: 'Drill 3: Lighting & Angle Robustness', gesture: 'Thumbs Up', target: 'Yes', duration: '4 mins', xp: 50, hint: 'Tilt hand slightly left and right while maintaining recognition.', isLocked: false }
    ]
  },
  {
    id: 'stt-mod-2',
    number: 2,
    title: 'Static Open Palm & Halt Command',
    subtitle: '5-finger separation & stop barrier geometry',
    description: 'Master the high-visibility "Stop" gesture with all 5 digits fully extended facing forward.',
    tier: 'Free',
    isLocked: false,
    duration: '14 mins',
    xp: 180,
    accentColor: '#10b981',
    icon: '✋',
    targetSigns: ['Stop (✋)'],
    drills: [
      { id: 'stt-d2-1', title: 'Drill 1: Broad Open Palm (Stop)', gesture: 'Open Palm', target: 'Stop', duration: '5 mins', xp: 60, hint: 'Fingers straight up, thumb spread comfortably out.', isLocked: false },
      { id: 'stt-d2-2', title: 'Drill 2: Rapid Halt Trigger', gesture: 'Open Palm', target: 'Stop', duration: '4 mins', xp: 60, hint: 'Raise palm quickly from below frame and freeze.', isLocked: false },
      { id: 'stt-d2-3', title: 'Drill 3: Edge-of-Frame Tolerance', gesture: 'Open Palm', target: 'Stop', duration: '5 mins', xp: 60, hint: 'Maintain open palm along left and right camera borders.', isLocked: false }
    ]
  },
  {
    id: 'stt-mod-3',
    number: 3,
    title: 'Index Counting & Pointing Accuracy',
    subtitle: 'Curling pinky, ring & middle while locking index up',
    description: 'Isolate the index finger cleanly for digit "One" and directional pointing.',
    tier: 'Free',
    isLocked: false,
    duration: '15 mins',
    xp: 200,
    accentColor: '#10b981',
    icon: '☝️',
    targetSigns: ['One (☝️)'],
    drills: [
      { id: 'stt-d3-1', title: 'Drill 1: Single Index Pointer (One)', gesture: 'Index Up', target: 'One', duration: '5 mins', xp: 65, hint: 'Index vertical, other 3 fingers curled tight with thumb over them.', isLocked: false },
      { id: 'stt-d3-2', title: 'Drill 2: Index Isolation Speed', gesture: 'Index Up', target: 'One', duration: '5 mins', xp: 65, hint: 'Switch from resting hand to upright index in under 0.5s.', isLocked: false },
      { id: 'stt-d3-3', title: 'Drill 3: Angular Pointing Test', gesture: 'Index Up', target: 'One', duration: '5 mins', xp: 70, hint: 'Angle index 15 degrees without losing confidence.', isLocked: false }
    ]
  },
  {
    id: 'stt-mod-4',
    number: 4,
    title: 'Peace & Victory Dual Angles',
    subtitle: 'Finger separation angles & V-shape distance',
    description: 'Train the dual-finger "Victory" peace sign with distinct spacing between index and middle tips.',
    tier: 'Free',
    isLocked: false,
    duration: '16 mins',
    xp: 240,
    accentColor: '#10b981',
    icon: '✌️',
    targetSigns: ['Victory (✌️)'],
    drills: [
      { id: 'stt-d4-1', title: 'Drill 1: Two-Finger V-Shape (Victory)', gesture: 'Peace Sign', target: 'Victory', duration: '5 mins', xp: 80, hint: 'Extend index and middle in a clear V with ring/pinky closed.', isLocked: false },
      { id: 'stt-d4-2', title: 'Drill 2: Wide vs Narrow V-Spread', gesture: 'Peace Sign', target: 'Victory', duration: '5 mins', xp: 80, hint: 'Separate fingertips by at least 5cm in camera view.', isLocked: false },
      { id: 'stt-d4-3', title: 'Drill 3: Palm Facing In vs Out', gesture: 'Peace Sign', target: 'Victory', duration: '6 mins', xp: 80, hint: 'Verify landmark detection from both palm orientations.', isLocked: false }
    ]
  },
  {
    id: 'stt-mod-5',
    number: 5,
    title: 'Fist Power & Tight Closure',
    subtitle: 'Curling all 4 knuckles flush against palm base',
    description: 'Calibrate the compact "Rock" gesture ensuring zero false-positive finger extension.',
    tier: 'Free',
    isLocked: false,
    duration: '18 mins',
    xp: 260,
    accentColor: '#10b981',
    icon: '✊',
    targetSigns: ['Rock (✊)'],
    drills: [
      { id: 'stt-d5-1', title: 'Drill 1: Tight Fist Closure (Rock)', gesture: 'Fist', target: 'Rock', duration: '6 mins', xp: 85, hint: 'All 4 fingers curled tightly, thumb resting across outer knuckles.', isLocked: false },
      { id: 'stt-d5-2', title: 'Drill 2: Clench & Hold Challenge', gesture: 'Fist', target: 'Rock', duration: '6 mins', xp: 85, hint: 'Maintain locked fist for 5 seconds without tremor.', isLocked: false },
      { id: 'stt-d5-3', title: 'Drill 3: Thumb Guard Check', gesture: 'Fist', target: 'Rock', duration: '6 mins', xp: 90, hint: 'Ensure thumb stays wrapped over fingers, not upright.', isLocked: false }
    ]
  },

  // ===================== PRO PAYWALL MODULES (6 TO 15) =====================
  {
    id: 'stt-mod-6',
    number: 6,
    title: 'Rapid Dual-Sign Switching',
    subtitle: 'Low-latency transitions between Yes and Stop',
    description: 'Toggle reflexively between Thumbs Up (Yes) and Open Palm (Stop) in under 800 milliseconds.',
    tier: 'Pro',
    isLocked: true,
    duration: '20 mins',
    xp: 350,
    accentColor: '#10b981',
    icon: '⚡',
    targetSigns: ['Yes (👍)', 'Stop (✋)'],
    drills: [
      { id: 'stt-d6-1', title: 'Drill 1: Yes ➔ Stop Transition', gesture: 'Yes to Stop', target: 'Yes', duration: '7 mins', xp: 115, hint: 'Start with Thumbs Up, then open immediately into flat Stop.', isLocked: true },
      { id: 'stt-d6-2', title: 'Drill 2: Stop ➔ Yes Counter-Switch', gesture: 'Stop to Yes', target: 'Stop', duration: '7 mins', xp: 115, hint: 'Reverse motion: snap open hand back into locked thumb.', isLocked: true },
      { id: 'stt-d6-3', title: 'Drill 3: 10-Rep Alternation Metronome', gesture: 'Alternation', target: 'Yes', duration: '6 mins', xp: 120, hint: 'Alternate at 60 BPM with 90%+ confidence lock.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-7',
    number: 7,
    title: 'Index to Peace Finger Articulation',
    subtitle: 'Deploying second finger without moving first',
    description: 'Smoothly articulate between "One" (Index) and "Victory" (Index + Middle).',
    tier: 'Pro',
    isLocked: true,
    duration: '20 mins',
    xp: 360,
    accentColor: '#10b981',
    icon: '🎯',
    targetSigns: ['One (☝️)', 'Victory (✌️)'],
    drills: [
      { id: 'stt-d7-1', title: 'Drill 1: One ➔ Victory Finger Deploy', gesture: 'One to Victory', target: 'One', duration: '7 mins', xp: 120, hint: 'Pop middle finger up alongside index smoothly.', isLocked: true },
      { id: 'stt-d7-2', title: 'Drill 2: Victory ➔ One Retract', gesture: 'Victory to One', target: 'Victory', duration: '7 mins', xp: 120, hint: 'Retract middle finger while leaving index standing tall.', isLocked: true },
      { id: 'stt-d7-3', title: 'Drill 3: Micro-Twitch Filter Calibration', gesture: 'Finger Hold', target: 'One', duration: '6 mins', xp: 120, hint: 'Eliminate false flickers during finger deployment.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-8',
    number: 8,
    title: '3-Pose Emergency Command Chain',
    subtitle: 'Stop ➔ Yes ➔ Victory chained alert sequence',
    description: 'Execute a composite 3-gesture security alert chain in under 3 seconds.',
    tier: 'Pro',
    isLocked: true,
    duration: '22 mins',
    xp: 380,
    accentColor: '#10b981',
    icon: '🚨',
    targetSigns: ['Stop (✋)', 'Yes (👍)', 'Victory (✌️)'],
    drills: [
      { id: 'stt-d8-1', title: 'Drill 1: Stop ➔ Yes ➔ Victory Chain', gesture: '3-Sign Chain', target: 'Stop', duration: '7 mins', xp: 125, hint: 'Halt hand ➔ Thumb confirm ➔ Victory peace.', isLocked: true },
      { id: 'stt-d8-2', title: 'Drill 2: Reverse Alert Sweep', gesture: 'Reverse Chain', target: 'Victory', duration: '7 mins', xp: 125, hint: 'Victory ➔ Yes ➔ Stop with steady tracking.', isLocked: true },
      { id: 'stt-d8-3', title: 'Drill 3: Speed Lock Challenge', gesture: 'Timed Chain', target: 'Yes', duration: '8 mins', xp: 130, hint: 'Complete full chain within 2.5 seconds.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-9',
    number: 9,
    title: 'Fist Release to Open Hand Reflex',
    subtitle: 'From zero extension (Rock) to maximum span (Stop)',
    description: 'Test extreme geometric transitions from tight fist closure directly into splayed palm.',
    tier: 'Pro',
    isLocked: true,
    duration: '22 mins',
    xp: 390,
    accentColor: '#10b981',
    icon: '🔄',
    targetSigns: ['Rock (✊)', 'Stop (✋)'],
    drills: [
      { id: 'stt-d9-1', title: 'Drill 1: Explosive Palm Release', gesture: 'Fist to Palm', target: 'Rock', duration: '7 mins', xp: 130, hint: 'Snap from compact fist to full 5-finger spread.', isLocked: true },
      { id: 'stt-d9-2', title: 'Drill 2: Instant Fist Collapse', gesture: 'Palm to Fist', target: 'Stop', duration: '7 mins', xp: 130, hint: 'Snap from wide open palm to tight fist in one frame.', isLocked: true },
      { id: 'stt-d9-3', title: 'Drill 3: 15-Burst Stamina Drill', gesture: 'Burst Series', target: 'Rock', duration: '8 mins', xp: 130, hint: '15 continuous releases without detection loss.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-10',
    number: 10,
    title: '5-Sign Clock Sprint Challenge',
    subtitle: 'Sequential mastery: Yes ➔ One ➔ Victory ➔ Rock ➔ Stop',
    description: 'The premier benchmark drill: Cycle sequentially through all 5 client-side poses.',
    tier: 'Pro',
    isLocked: true,
    duration: '25 mins',
    xp: 450,
    accentColor: '#10b981',
    icon: '⏱️',
    targetSigns: ['Yes', 'One', 'Victory', 'Rock', 'Stop'],
    drills: [
      { id: 'stt-d10-1', title: 'Drill 1: 5-Pose Clock Run', gesture: 'Full 5-Sign Cycle', target: 'Yes', duration: '8 mins', xp: 150, hint: 'Cycle 1: Yes ➔ 2: One ➔ 3: Victory ➔ 4: Rock ➔ 5: Stop.', isLocked: true },
      { id: 'stt-d10-2', title: 'Drill 2: Sub-10 Second Sprint', gesture: 'Speed Sprint', target: 'One', duration: '8 mins', xp: 150, hint: 'Hit all 5 signs in under 10 seconds total.', isLocked: true },
      { id: 'stt-d10-3', title: 'Drill 3: Flawless Accuracy Record', gesture: 'Zero Failure Run', target: 'Victory', duration: '9 mins', xp: 150, hint: '100% confidence on all 5 poses without any misdetection.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-11',
    number: 11,
    title: 'Low-Light & Variable Distance Robustness',
    subtitle: 'Tracking near webcam and across room distance',
    description: 'Maintain landmark stability from 0.3m close-up up to 2.5m room distance.',
    tier: 'Pro',
    isLocked: true,
    duration: '24 mins',
    xp: 420,
    accentColor: '#10b981',
    icon: '💡',
    targetSigns: ['Stop (✋)', 'One (☝️)'],
    drills: [
      { id: 'stt-d11-1', title: 'Drill 1: Close-Up Palm Detection (30cm)', gesture: 'Near Palm', target: 'Stop', duration: '8 mins', xp: 140, hint: 'Hold hand close to camera lens without distortion.', isLocked: true },
      { id: 'stt-d11-2', title: 'Drill 2: Long-Distance Pointer (2 Meters)', gesture: 'Far Index', target: 'One', duration: '8 mins', xp: 140, hint: 'Step back 2 meters and point index clearly.', isLocked: true },
      { id: 'stt-d11-3', title: 'Drill 3: Dim Room Shadow Compensation', gesture: 'Shadow Hold', target: 'Stop', duration: '8 mins', xp: 140, hint: 'Verify landmark coordinates under warm shadow lighting.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-12',
    number: 12,
    title: 'Tremor & Hand Shake Compensation',
    subtitle: 'Filtering involuntary movement with hold confidence',
    description: 'Optimized detection rules for users with mild tremors or unsteady hands.',
    tier: 'Pro',
    isLocked: true,
    duration: '24 mins',
    xp: 420,
    accentColor: '#10b981',
    icon: '🤝',
    targetSigns: ['Yes (👍)', 'Rock (✊)'],
    drills: [
      { id: 'stt-d12-1', title: 'Drill 1: Gentle Shake Immunity (Thumbs Up)', gesture: 'Tremor Filter', target: 'Yes', duration: '8 mins', xp: 140, hint: 'Slightly tremble hand while keeping thumb upright.', isLocked: true },
      { id: 'stt-d12-2', title: 'Drill 2: Rotational Wobble Test', gesture: 'Wobble Rock', target: 'Rock', duration: '8 mins', xp: 140, hint: 'Twist wrist 20 degrees while maintaining tight fist.', isLocked: true },
      { id: 'stt-d12-3', title: 'Drill 3: Adaptive Sensitivity Verification', gesture: 'Sensitivity Check', target: 'Yes', duration: '8 mins', xp: 140, hint: 'Test with sensitivity slider set to 0.4 in Settings.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-13',
    number: 13,
    title: 'Sub-Second Speed Lock Drills',
    subtitle: 'Lightning-fast frame analysis under 400ms',
    description: 'Push MediaPipe execution speed to maximum for esports-level reflex sign recognition.',
    tier: 'Pro',
    isLocked: true,
    duration: '25 mins',
    xp: 450,
    accentColor: '#10b981',
    icon: '🏎️',
    targetSigns: ['Victory (✌️)', 'One (☝️)'],
    drills: [
      { id: 'stt-d13-1', title: 'Drill 1: 400ms Flash Point (One)', gesture: 'Flash Index', target: 'One', duration: '8 mins', xp: 150, hint: 'Flash index finger into frame for only 0.5s.', isLocked: true },
      { id: 'stt-d13-2', title: 'Drill 2: 400ms Flash Victory (Peace)', gesture: 'Flash Peace', target: 'Victory', duration: '8 mins', xp: 150, hint: 'Flash peace sign into frame with instant recognition.', isLocked: true },
      { id: 'stt-d13-3', title: 'Drill 3: Random Flash Reflex Test', gesture: 'Random Reflex', target: 'One', duration: '9 mins', xp: 150, hint: 'Respond to on-screen audio prompts instantly.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-14',
    number: 14,
    title: 'Continuous Sentence & Dialogue Assembly',
    subtitle: 'Multi-word translation without resetting stream',
    description: 'Assemble multi-sign phrases like "Stop ➔ One ➔ Yes" into coherent sentence strings.',
    tier: 'Pro',
    isLocked: true,
    duration: '26 mins',
    xp: 480,
    accentColor: '#10b981',
    icon: '💬',
    targetSigns: ['Stop', 'One', 'Yes'],
    drills: [
      { id: 'stt-d14-1', title: 'Drill 1: Phrase "Stop, Just One Moment"', gesture: 'Stop ➔ One', target: 'Stop', duration: '8 mins', xp: 160, hint: 'Hold Stop, then switch cleanly to One.', isLocked: true },
      { id: 'stt-d14-2', title: 'Drill 2: Phrase "One Confirmed Victory"', gesture: 'One ➔ Victory', target: 'One', duration: '9 mins', xp: 160, hint: 'Hold One, transition into Victory smoothly.', isLocked: true },
      { id: 'stt-d14-3', title: 'Drill 3: 4-Word Sentence Masterclass', gesture: 'Sentence Stream', target: 'Yes', duration: '9 mins', xp: 160, hint: 'Stream 4 consecutive words into translation history.', isLocked: true }
    ]
  },
  {
    id: 'stt-mod-15',
    number: 15,
    title: 'Sign-to-Text Master Certification',
    subtitle: 'Comprehensive computer vision board examination',
    description: 'The final examination: Complete 20 randomized sign challenges with 95%+ precision.',
    tier: 'Pro',
    isLocked: true,
    duration: '30 mins',
    xp: 600,
    accentColor: '#10b981',
    icon: '🏆',
    targetSigns: ['All 5 Gestures'],
    drills: [
      { id: 'stt-d15-1', title: 'Exam Part 1: Blind Pose Recognition', gesture: 'Blind Test', target: 'Yes', duration: '10 mins', xp: 200, hint: 'Perform signs prompted at random intervals.', isLocked: true },
      { id: 'stt-d15-2', title: 'Exam Part 2: High-Speed Reflex Exam', gesture: 'Speed Exam', target: 'Victory', duration: '10 mins', xp: 200, hint: '10 consecutive signs with zero hesitation.', isLocked: true },
      { id: 'stt-d15-3', title: 'Exam Part 3: Grand Master Certification', gesture: 'Final Board', target: 'Stop', duration: '10 mins', xp: 200, hint: 'Pass with 100% score to earn the Sign Master badge!', isLocked: true }
    ]
  }
];
