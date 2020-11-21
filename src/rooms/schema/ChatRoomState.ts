import { Schema, type, ArraySchema } from "@colyseus/schema";

export class Answer extends Schema {
  @type("string")
  answer: string;

  @type("boolean")
  isCorrect: boolean;
}

export class Question extends Schema {
  @type("string")
  question: string;

  @type([Answer])
  answers = new ArraySchema<Answer>();

}

export class ChatRoom extends Schema {

  @type([Question])
  questions = new ArraySchema<Question>();

}