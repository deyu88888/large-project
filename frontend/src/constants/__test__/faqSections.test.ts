import { describe, it, expect } from 'vitest';
import { faqSections, type FAQSection, type FAQQuestion } from '../faqSections.ts';

describe('FAQ Data Structure', () => {
  it('should have the correct structure', () => {
    // Check that faqSections is an array
    expect(Array.isArray(faqSections)).toBe(true);
    
    // Check that we have exactly 5 sections
    expect(faqSections.length).toBe(5);
    
    // Verify each section has the correct properties
    faqSections.forEach((section) => {
      expect(section).toHaveProperty('title');
      expect(section).toHaveProperty('questions');
      expect(Array.isArray(section.questions)).toBe(true);
      
      // Each section should have 4 questions
      expect(section.questions.length).toBe(4);
      
      // Verify each question has the correct properties
      section.questions.forEach((question) => {
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('answer');
        expect(typeof question.question).toBe('string');
        expect(typeof question.answer).toBe('string');
        expect(question.question.length).toBeGreaterThan(0);
        expect(question.answer.length).toBeGreaterThan(0);
      });
    });
  });
  
  it('should have the expected section titles', () => {
    const expectedTitles = [
      'General Questions',
      'Events & Activities',
      'Account Management',
      'Society Leadership',
      'Technical Support'
    ];
    
    const actualTitles = faqSections.map(section => section.title);
    expect(actualTitles).toEqual(expectedTitles);
  });
  
  it('should have the correct number of questions in each section', () => {
    faqSections.forEach(section => {
      expect(section.questions.length).toBe(4);
    });
  });
  
  it('should have the expected General Questions content', () => {
    const generalSection = faqSections.find(section => section.title === 'General Questions');
    expect(generalSection).toBeDefined();
    
    const questionTexts = generalSection?.questions.map(q => q.question);
    expect(questionTexts).toContain('How do I join a society?');
    expect(questionTexts).toContain('How much are membership fees?');
    expect(questionTexts).toContain('Can I join multiple societies?');
    expect(questionTexts).toContain('Is there a deadline to join societies?');
    
    // Test a specific Q&A pair
    const joinQuestion = generalSection?.questions.find(q => q.question === 'How do I join a society?');
    expect(joinQuestion?.answer).toContain('navigate to the society\'s page and click the "Join" button');
  });
  
  it('should have the expected Events & Activities content', () => {
    const eventsSection = faqSections.find(section => section.title === 'Events & Activities');
    expect(eventsSection).toBeDefined();
    
    const questionTexts = eventsSection?.questions.map(q => q.question);
    expect(questionTexts).toContain('How do I register for society events?');
    expect(questionTexts).toContain('Are events only for society members?');
    expect(questionTexts).toContain('How can I find out about upcoming events?');
    expect(questionTexts).toContain('Can I suggest ideas for society activities?');
  });
  
  it('should have the expected Account Management content', () => {
    const accountSection = faqSections.find(section => section.title === 'Account Management');
    expect(accountSection).toBeDefined();
    
    const questionTexts = accountSection?.questions.map(q => q.question);
    expect(questionTexts).toContain('How do I create an account?');
    expect(questionTexts).toContain('How do I reset my password?');
    expect(questionTexts).toContain('How do I update my profile information?');
    expect(questionTexts).toContain('Can I change my notification settings?');
  });
  
  it('should have the expected Society Leadership content', () => {
    const leadershipSection = faqSections.find(section => section.title === 'Society Leadership');
    expect(leadershipSection).toBeDefined();
    
    const questionTexts = leadershipSection?.questions.map(q => q.question);
    expect(questionTexts).toContain('How can I start a new society?');
    expect(questionTexts).toContain('What responsibilities do society leaders have?');
    expect(questionTexts).toContain('How are society elections conducted?');
    expect(questionTexts).toContain('How do I access society management tools?');
  });
  
  it('should have the expected Technical Support content', () => {
    const supportSection = faqSections.find(section => section.title === 'Technical Support');
    expect(supportSection).toBeDefined();
    
    const questionTexts = supportSection?.questions.map(q => q.question);
    expect(questionTexts).toContain('Who do I contact if I\'m having website issues?');
    expect(questionTexts).toContain('Is my payment information secure?');
    expect(questionTexts).toContain('Can I access the website on mobile devices?');
    expect(questionTexts).toContain('How do I report inappropriate content or behavior?');
    
    // Test a specific answer that contains an email
    const supportQuestion = supportSection?.questions.find(q => q.question === 'Who do I contact if I\'m having website issues?');
    expect(supportQuestion?.answer).toContain('infiniteloop@gmail.com');
  });
  
  it('should have non-empty answers for all questions', () => {
    faqSections.forEach(section => {
      section.questions.forEach(question => {
        expect(question.answer.trim()).not.toBe('');
        expect(question.answer.length).toBeGreaterThan(10);  
      });
    });
  });
  
  it('should have correctly typed data', () => {
    // Type checking test
    const testSection: FAQSection = faqSections[0];
    const testQuestion: FAQQuestion = testSection.questions[0];
    
    expect(typeof testSection.title).toBe('string');
    expect(Array.isArray(testSection.questions)).toBe(true);
    expect(typeof testQuestion.question).toBe('string');
    expect(typeof testQuestion.answer).toBe('string');
  });
});