export type FAQQuestion = {
  question: string;
  answer: string;
};

export type FAQSection = {
  title: string;
  questions: FAQQuestion[];
};

export const faqSections: FAQSection[] = [
  {
    title: "General Questions",
    questions: [
      {
        question: "How do I join a society?",
        answer: "To join a society, navigate to the society's page and click the \"Join\" button. You will need to complete registration with your student email to join any societies."
      },
      {
        question: "Can I join multiple societies?",
        answer: "Yes, you can join as many societies as you wish. Just be mindful of managing your time and commitments!"
      },
      {
        question: "Is there a deadline to join societies?",
        answer: "Most societies accept new members throughout the academic year, but some competitive societies may have application deadlines. Check individual society pages for specific information."
      }
    ]
  },
  {
    title: "Events & Activities",
    questions: [
      {
        question: "How do I register for society events?",
        answer: "You must be logged in. Navigate to the \"Events\" section, find the event you're interested in, and click \"RSVP.\""
      },
      {
        question: "Are events only for society members?",
        answer: "This varies by event. Some events are open to all students, while others are exclusive to society members. Event listings will specify eligibility."
      },
      {
        question: "How can I find out about upcoming events?",
        answer: "You can view all upcoming events on the \" All Events\" page, filter by society, or check the dashboard for highlighted events. You'll also receive notifications for events from societies you've joined."
      },
    ]
  },
  {
    title: "Account Management",
    questions: [
      {
        question: "How do I create an account?",
        answer: "Click \"Register\" in the top navigation, enter your student email and create a password. Verify your email to complete registration."
      },
      {
        question: "How do I update my profile information?",
        answer: "After logging in, click on your profile picture/icon and update your information."
      },
      {
        question: "How do I change my password?",
        answer: "You may change your password in the Profile section once you are logged in."
      },
      {
        question: "How do I change my email?",
        answer: "You may change your email in the Profile section once you are logged in. You will need to authenticate via an OTP."
      },
    ]
  },
  {
    title: "Society Leadership",
    questions: [
      {
        question: "How can I start a new society?",
        answer: "Visit the \"Start Society\" page to submit an application. You'll need to provide a society name, description. You will receive a notification once your application is reviewed."
      },
      {
        question: "What responsibilities do society leaders have?",
        answer: "Leaders manage membership, organise events, handle society finances, and ensure compliance with university regulations."
      },
      {
        question: "How are society elections conducted?",
        answer: "Most societies hold elections at the end of each academic year. The process varies by society but typically involves nominations and voting by members."
      },
      {
        question: "How do I access society management tools?",
        answer: "Society officers can access management tools by logging in and navigating to \"Society Management\" in their dashboard."
      }
    ]
  },
  {
    title: "Technical Support",
    questions: [
      {
        question: "Who do I contact if I'm having website issues?",
        answer: "Email infiniteloop@gmail.com or use the \"Contact Support\" form in the website footer."
      },
      {
        question: "How do I report inappropriate content or behavior?",
        answer: "Use the \"Report\" button available on all content pages, or contact the website administrators through the support form below."
      }
    ]
  }
];