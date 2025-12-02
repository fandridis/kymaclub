import { Infer, v } from "convex/values";
import {
    questionTypeValidator,
    questionOptionFields,
    questionFields,
    questionAnswerFields,
    questionnaireAnswersFields,
} from "../convex/schema";

/***************************************************************
 * Question Types - Derived from schema validators
 ***************************************************************/

// Question type union (boolean, single_select, multi_select, number, text)
export type QuestionType = Infer<typeof questionTypeValidator>;

// Question option (for select types)
const questionOptionFieldObject = v.object(questionOptionFields);
export type QuestionOption = Infer<typeof questionOptionFieldObject>;

// Question definition
const questionFieldObject = v.object(questionFields);
export type Question = Infer<typeof questionFieldObject>;

// Question answer (stored with booking)
const questionAnswerFieldObject = v.object(questionAnswerFields);
export type QuestionAnswer = Infer<typeof questionAnswerFieldObject>;

// Questionnaire answers snapshot (stored in booking)
const questionnaireAnswersFieldObject = v.object(questionnaireAnswersFields);
export type QuestionnaireAnswers = Infer<typeof questionnaireAnswersFieldObject>;

/***************************************************************
 * Helper Types
 ***************************************************************/

// Questionnaire (array of questions)
export type Questionnaire = Question[];

// Number config type
export type NumberConfig = Question['numberConfig'];

// Boolean config type  
export type BooleanConfig = Question['booleanConfig'];

// Text config type
export type TextConfig = Question['textConfig'];

