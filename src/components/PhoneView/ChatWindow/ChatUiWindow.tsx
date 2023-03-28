import Chat from "@chatui/core";
import "@chatui/core/dist/index.css";
import axios from "axios";
import { FC, useCallback, useContext, useEffect, useMemo } from "react";
import moment from "moment";
import { filter, sortBy, toUpper } from "lodash";
import { AppContext } from "../../../utils/app-context";
import { toast } from "react-hot-toast";
import { RenderComp } from "./Comps";
import { User } from "../../../types";

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

export const getMsgType = (msg: any) => {
  //type: msg?.payload?.buttonChoices || msg?.choices ? "options" : "text",
  if (msg?.payload?.buttonChoices || msg?.choices) return "options";
  if (msg?.imageUrl) return "image";
  if (msg?.videoUrl) return "video";
  if (msg?.audioUrl) return "audio";
  if (msg?.payload?.media) {
    switch (msg?.payload?.media?.category) {
      case "IMAGE":
      case "IMAGE_URL":
        return "image";
      case "VIDEO":
      case "VIDEO_URL":
        return "video";

      case "AUDIO":
      case "AUDIO_URL":
        return "audio";
      default:
        return "text";
    }
  }
  return "text";
};

// interface messageProps {
//   text: any;
//   username: string;
//   self: boolean;
//   choices: { key: string; text: string; backmenu: boolean }[];
//   data: any;
//   location: any;
//   image: any;
//   caption: string;
//   audio: any;
//   video: any;
//   doc: any;
// }
const ChatUiWindow: FC<{
  currentUser: any;
  setState: any;
}> = ({   currentUser, setState }) => {

  const context = useContext(AppContext);
 
console.log("qwcd:",{context})
  const chatUIMsg = useMemo(() => {
    return context?.messages?.map((msg) => ({
      type: getMsgType(msg),
      content: { text: msg?.text, data: { ...msg } },
      position: msg?.position ?? "right",
    }));
  }, [context?.messages]);

  useEffect(() => {
    let phone = localStorage.getItem("mobile");
    if (phone === "") alert("Number required");
    if (navigator.onLine) {
      console.log("qwe1: online");
      const url = `${
        process.env.REACT_APP_CHAT_HISTORY_URL
      }/xmsg/conversation-history?provider=pwa&endDate=${moment().format(
        "DD-MM-YYYY"
      )}&startDate=19-03-2023&botId=${
        JSON.parse(localStorage.getItem("currentUser"))?.id
      }&userId=${`ucipwa:${phone}`}`;
      axios
        .get(url)
        .then((res) => {
          if (res?.data?.result?.records?.length > 0) {
            const normalizedChats = normalizedChat(
              res.data.result.records,
              currentUser
            );
            window &&
              window?.androidInteract?.onEvent(JSON.stringify(normalizedChats));
            setState((prev: any) => ({ ...prev, messages: normalizedChats }));
            localStorage.setItem("userMsgs", JSON.stringify(normalizedChats));
            context?.setMessages(normalizedChats);
          } else {
            // @ts-ignore
          context?.sendMessage(currentUser?.startingMessage, null, false, currentUser);
          }
        })
        .catch((err) => {
          console.error("cvbn:", err);
          toast.error(JSON.stringify(err?.message));
          window &&
            window?.androidInteract?.onEvent(
              `error in fetching chat history(online):${JSON.stringify(err)}`
            );
        });
    } else {
      try {
        if (localStorage.getItem("chatHistory")) {
          const offlineMsgs = filter(
            JSON.parse(localStorage.getItem("chatHistory")),
            { botUuid: currentUser?.id }
          );
          window &&
            window?.androidInteract?.onEvent(
              localStorage.getItem("chatHistory")
            );
          setState((prev: any) => ({
            ...prev,
            messages: JSON.parse(localStorage.getItem("chatHistory")),
          }));
          context?.setMessages(offlineMsgs);
        }
      } catch (err) {
        window &&
          window?.androidInteract?.onEvent(
            `error in getting chat history(offline):${JSON.stringify(err)}`
          );
      }
    }
  }, []);

  useEffect(() => {
    try {
      window &&
        window?.androidInteract?.onChatCompleted?.(
          String(currentUser?.id),
          JSON.stringify(context?.state?.messages)
        );
      window &&
        window?.androidInteract?.onEvent(
          JSON.stringify(context?.state?.messages)
        );
    } catch (err) {
      window &&
        window?.androidInteract?.onEvent(
          `error in onChatCompleted func:${JSON.stringify(err)}`
        );
    }
  }, [context?.state?.messages, currentUser?.id]);

  const handleSend = useCallback(
    (type: string, val: any) => {
      if (type === "text" && val.trim()) {
        //@ts-ignore
        context?.sendMessage(val, null, true);
      }
    },
    [context]
  );

  return (
    <>
      <Chat
        //@ts-ignore
        messages={chatUIMsg}
        renderMessageContent={(props) => (
          <RenderComp
            msg={props}
            chatUIMsg={chatUIMsg}
            currentUser={currentUser}
            onSend={context?.sendMessage}
          />
        )}
        onSend={handleSend}
        locale="en-US"
        placeholder="Ask Your Question"
      />
    </>
  );
};

export default ChatUiWindow;
