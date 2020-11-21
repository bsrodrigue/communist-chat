import * as Colyseus from 'colyseus.js';
import 'emoji-picker-element';

let client = new Colyseus.Client('ws://localhost:2567');
let isTyping = false;
let isTypingTimeout: NodeJS.Timeout = undefined;
let nickName: string = "";

interface MessageCard {
    title: string;
    content: string;
    time: string;
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

        // room.onMessage(messages['NEW_USER'], (message: string) => {
        //     appendMessage(message);
        // });

        room.onMessage(messages['MESSAGE_SENT'], (message: MessageCard) => {
            appendMessage(message);
        });

        // room.onMessage(messages['USER_LEFT'], (message: string) => {
        //     appendMessage(message);
        // });

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

            let message: string = $('.message-input').val().toString();

            room.send('message', {
                message: message,
                nickName: nickName,
            });

            //Clear Input
            $('.message-input').val("");
        });



    } catch (error) {
        console.log("Error while joining the Room: ", error);
    }
}

start();