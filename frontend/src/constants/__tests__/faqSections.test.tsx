import { describe, it, expect } from 'vitest';
import { faqSections, FAQSection, FAQQuestion } from '../faqSections';

describe('FAQ Sections', () => {
  it('should have at least one section', () => {
    expect(faqSections.length).toBeGreaterThan(0);
  });

  it('each section should have a non-empty title', () => {
    faqSections.forEach((section: FAQSection) => {
      expect(section.title).toBeTruthy();
      expect(section.title.trim()).not.toBe('');
    });
  });

  it('each section should have at least one question', () => {
    faqSections.forEach((section: FAQSection) => {
      expect(section.questions.length).toBeGreaterThan(0);
    });
  });
});

describe('FAQ Questions', () => {
  it('each question should have a non-empty question and answer', () => {
    faqSections.forEach((section: FAQSection) => {
      section.questions.forEach((question: FAQQuestion) => {
        expect(question.question).toBeTruthy();
        expect(question.answer).toBeTruthy();
        expect(question.question.trim()).not.toBe('');
        expect(question.answer.trim()).not.toBe('');
      });
    });
  });

  it('questions should not be duplicated within a section', () => {
    faqSections.forEach((section: FAQSection) => {
      const questionSet = new Set();
      section.questions.forEach((question: FAQQuestion) => {
        expect(questionSet.has(question.question)).toBe(false);
        questionSet.add(question.question);
      });
    });
  });

  it('questions should have a reasonable length', () => {
    faqSections.forEach((section: FAQSection) => {
      section.questions.forEach((question: FAQQuestion) => {
        expect(question.question.length).toBeLessThan(200);
        expect(question.answer.length).toBeLessThan(500);
      });
    });
  });
});

describe('FAQ Sections Coverage', () => {
  const expectedSectionTitles = [
    'General Questions',
    'Events & Activities',
    'Account Management', 
    'Society Leadership',
    'Technical Support'
  ];

  it('should have all expected section titles', () => {
    const actualSectionTitles = faqSections.map(section => section.title);
    expectedSectionTitles.forEach(title => {
      expect(actualSectionTitles).toContain(title);
    });
  });

  it('should not have more section titles than expected', () => {
    const actualSectionTitles = faqSections.map(section => section.title);
    expect(actualSectionTitles.length).toBe(expectedSectionTitles.length);
  });
});