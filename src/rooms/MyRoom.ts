import { Room, Client } from "colyseus";
import { ChatRoom, Question, Answer } from "./schema/ChatRoomState";
import moment from "moment";

let userLog = new Map();

interface MessageCard{
  title: string;
  content: string;
  time: string;
}

const messages = {
  'NEW_USER': 'new-user',
  'USER_LEFT': 'user-left',
}

export class MyRoom extends Room {

  onCreate(options: any) {
    this.setState(new ChatRoom());

    //When a user sends a new message
    this.onMessage('message', (client: any, data: any) => {
      let userNickname: string = data.nickName;
      let userMessage: string = data.message;
      let messageSentAt: string = moment().format('LT');
      
      let newMessage: MessageCard = {
        title: userNickname,
        content: userMessage,
        time: messageSentAt,
      }
      this.broadcast('message-sent', newMessage);
    });

    //When a user is typing
    this.onMessage('is-typing', (client:any, data:any)=>{
      let broadcastMessage: string = data.isTyping? `${data.nickName} is typing`:"";
      this.broadcast('is-typing', broadcastMessage, {
        except: client,
      });
    });

  }

  //When a new user joins the chatroom
  onJoin(client: Client, options: any) {
    let newUserNickname = options.nickName;
    userLog.set(client.id, {
      nickName: newUserNickname,
    });
    let broadcastMessage = `New user ${newUserNickname} joined the chatroom!`;
    this.broadcast(messages['NEW_USER'], broadcastMessage, {
      except: client,
    });
  }

  //When a user leaves the chatroom
  onLeave(client: Client, consented: boolean) {
    let whoLeft = userLog.get(client.id);
    let broadcastMessage = `User ${whoLeft.nickName} left the chatroom!`;
    this.broadcast(messages['USER_LEFT'], broadcastMessage, {
      except: client,
    });
  }

  onDispose() {
  }

}
