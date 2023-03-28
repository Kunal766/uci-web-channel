import Chat from "@chatui/core";
import "@chatui/core/dist/index.css";
import axios from "axios";
import { FC, useCallback, useContext, useEffect, useMemo } from "react";
import { filter, find } from "lodash";
import { AppContext } from "../../../utils/app-context";
import { toast } from "react-hot-toast";
import { RenderComp } from "./Comps";
import { normalizedChat } from "../../../utils/normalize-chats";
import { getMsgType } from "../../../utils/get-msg-type";
import { Conversation_History_Url } from "../../../utils/urls";


const ChatUiWindow: FC<{
  currentUser: any;
  setState: any;
}> = ({ currentUser, setState }) => {
  const context = useContext(AppContext);


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
      axios
        .get(Conversation_History_Url)
        .then((res) => {
          if (res?.data?.result?.records?.length > 0) {
          
            const normalizedChats = normalizedChat(
              res.data.result.records,
              currentUser
            );
           
            window &&
              window?.androidInteract?.onEvent(JSON.stringify(normalizedChats));
          //  setState((prev: any) => ({ ...prev, messages: normalizedChats }));
            localStorage.setItem("userMsgs", JSON.stringify(normalizedChats));
            context?.setMessages(normalizedChats);
          } else {
            console.log('qw123: no history')
            // @ts-ignore
            context?.sendMessage(
              currentUser?.startingMessage,
              null,
              false,
              currentUser
            );
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
          // setState((prev: any) => ({
          //   ...prev,
          //   messages: JSON.parse(localStorage.getItem("chatHistory")),
          // }));
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
        if (
          find(context?.botStartingMsgs, { msg: val.trim() }) &&
          find(context?.botStartingMsgs, { msg: val.trim() })?.id !==
            currentUser?.botUuid
        ) {
          toast.error("action not allowed");
        } else {
          context?.sendMessage(val, null, true);
        }
      }
    },
    [context, currentUser?.botUuid]
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
