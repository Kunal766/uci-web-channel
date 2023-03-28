import { filter, sortBy, toUpper } from "lodash";
import moment from "moment";
import { User } from "../types";

export const normalizedChat = (chats: any, currentUser: User) => {
    return sortBy(
     filter(
       chats?.map((chat) => ({
         ...chat,
         disabled: true,
         text: chat?.payload?.text,
         username: chat?.userId,
         position: chat?.messageState === "SENT" ? "left" : "right",
         isIgnore:
           toUpper(chat?.payload?.text) ===
           //@ts-ignore
           toUpper(currentUser?.startingMessage),
         time: moment(chat.sentTimestamp || chat.repliedTimestamp).valueOf(),
       })),
       { isIgnore: false }
     ),
     ["time", "messageState"]
   );
   
 };
 