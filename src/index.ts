import * as Colyseus from 'colyseus.js';
import 'emoji-picker-element';

const protocol = window.location.protocol.replace('http', 'ws');
const hostname = window.location.hostname;
const port = window.location.port;
const endpoint = `${protocol}//${hostname}:${port}`;

let client = new Colyseus.Client(endpoint);

let isTyping = false;
let isTypingTimeout: NodeJS.Timeout = undefined;
let nickName = "";

interface UserMessageContent {
    title: string;
    body: string;
    time: string;
}

enum InfoMessageType{
    Success = "success",
    Warning = "warning",
    Danger = "danger",
    Info = "info",
}

abstract class BaseMessage {
    abstract toHtml(): string;
    appendToDOM(): void {
        $('.discussion').append(this.toHtml());

        //Scroll down to the last Message
        let discussionDiv = document.querySelector('.discussion');
        discussionDiv.lastElementChild.scrollIntoView();
    }
}

class InfoMessage extends BaseMessage {
    private body: string;
    private type: string;
    public static Type: InfoMessageType;
    constructor(body: string, type: string) {
        super();
        this.body = body;
        this.type = type;
    }
    toHtml(): string {
        let output = `<div class="info-card card material-shadow ${this.type}">
                             <p>${this.body}</p>
                    </div> `
        return output;
    }
}

class UserMessage extends BaseMessage {
    content: UserMessageContent;
    constructor(content: UserMessageContent) {
        super();
        this.content = content;
    }
    toHtml(): string {

        let you = "";
        let right = "";

        if (this.content.title === nickName) {
            right = 'message-card-right';
            you = "You";
        }

        let output = `
        <div class="message-card material-shadow card ${right} ">
            <p class="message-card-title">${you || this.content.title}</p>
            <p class="message-card-content">${this.content.body}</p>
            <small message-card-time>${this.content.time}</small>
        </div>
        `
        return output;
    }
}



//Sends the message to the server
function sendMessage(room: any) {
    let message: string = $('.message-input').val().toString();

    room.send('message', {
        message: message,
        nickName: nickName,
    });

    //Clear Input
    $('.message-input').val("");
}

const rooms = {
    'CHAT_ROOM': 'chat-room',
}

const messages = {
    'NEW_USER': 'new-user',
    'USER_LEFT': 'user-left',
    'MESSAGE_SENT': 'message-sent',
    'IS_TYPING': 'is-typing',
}

async function start() {
    while (nickName === "") {
        nickName = prompt("Please, enter your nickname");
    }

    let joinOptions = {
        nickName: nickName,
    };


    try {
        let room: any = await client.joinOrCreate(
            rooms['CHAT_ROOM'],
            joinOptions,
        );

        localStorage.setItem("ROOM_ID",room.id);
        localStorage.setItem("SESSION_ID",room.sessionId);

        room.onMessage(messages['NEW_USER'], (message: string) => {
            new InfoMessage(message, InfoMessageType.Info).appendToDOM();
        });

        room.onMessage(messages['MESSAGE_SENT'], (message: UserMessageContent) => {
            new UserMessage(message).appendToDOM();
        });

        room.onMessage(messages['USER_LEFT'], (message: string) => {
            new InfoMessage(message, InfoMessageType.Danger).appendToDOM();
        });

        room.onMessage(messages['IS_TYPING'], (message: string) => {
            $('.is-typing').html(message);
        });



        document.querySelector('emoji-picker')
            .addEventListener('emoji-click', e => {
                let message: string = $('.message-input').val().toString();
                let emoji: string = e.detail.unicode;

                message = message + emoji;
                $('.message-input').val(message);
            });

        $('.message-input').keyup(e => {

            clearTimeout(isTypingTimeout);

            if (e.keyCode === 13) {
                sendMessage(room);
            }

            room.send('is-typing', {
                isTyping: true,
                nickName: nickName,
            });

            isTypingTimeout = setTimeout(() => {

                room.send('is-typing', {
                    isTyping: false,
                    nickName: nickName,
                });

            }, 1000);

        });



        $('.input-button').click(e => {
            e.preventDefault();

            sendMessage(room);
        });



    } catch (error) {
        console.log("Error while joining the Room: ", error);
    }
}

start();