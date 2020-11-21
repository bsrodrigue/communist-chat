import * as Colyseus from 'colyseus.js';
import 'emoji-picker-element';

let protocol = window.location.protocol.replace('http', 'ws');
let hostname = window.location.hostname;
let port = window.location.port;
let endpoint = `${protocol}//${hostname}:${port}`;
console.log(endpoint);
let client = new Colyseus.Client(endpoint);
let isTyping = false;
let isTypingTimeout: NodeJS.Timeout = undefined;
let nickName: string = "";

interface MessageCard {
    title: string;
    content: string;
    time: string;
}


//Shows an bootstrap Alert
function bootstrapAlert(message: string, type: string, ms: number = 3000) {
    let action: Function = type === "join" ? () => {
        $('.alert-success').html(message);
        $('.alert-success').fadeIn(ms).fadeOut(ms);

    } : () => {
        $('.alert-danger').html(message);
        $('.alert-danger').fadeIn(ms).fadeOut(ms);

    };

    action();
}

//Creates a new message card and adds it to the discussion
function appendMessage(message: MessageCard) {
    let messageCard = document.createElement('div');
    let messageCardTitle = document.createElement('p');
    let messageCardContent = document.createElement('p');
    let messageCardTime = document.createElement('small');

    messageCardTime.classList.add('message-card-time');
    messageCardContent.classList.add('message-card-content');
    messageCardTitle.classList.add('message-card-title');
    messageCard.classList.add('message-card', 'material-shadow');

    messageCardTitle.innerHTML = message.title;
    messageCardContent.innerHTML = message.content;
    messageCardTime.innerHTML = message.time;

    if (message.title === nickName) {
        messageCard.classList.add('message-card-right');
        messageCardTitle.innerHTML = "You";
    }

    messageCard.append(messageCardTitle, messageCardContent, messageCardTime);

    $('.discussion').append(messageCard);
}

//Sends the message to the server
function sendMessage(room: any) {
    let finalMessage: string = $('.message-input').val().toString();

    room.send('message', {
        message: finalMessage,
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


    // askNotificationPermission();

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

        room.onMessage(messages['NEW_USER'], (message: string) => {
            bootstrapAlert(message, 'join');
        });

        room.onMessage(messages['MESSAGE_SENT'], (message: MessageCard) => {
            appendMessage(message);
            let discussionDiv = document.querySelector('.discussion');
            discussionDiv.lastElementChild.scrollIntoView();
        });

        room.onMessage(messages['USER_LEFT'], (message: string) => {
            bootstrapAlert(message, 'left');
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