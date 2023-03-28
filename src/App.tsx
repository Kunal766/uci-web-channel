import { useCallback, useEffect, useMemo, useState } from "react";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import { User } from "./types";
import Home from "./pages/home";
import Chats from "./pages/chats";
import StarredChats from "./pages/starred-chats";
import StarredChatsPage from "./pages/starred-chat-page";
import axios from "axios";
import { AppContext } from "./utils/app-context";
import { CookiesProvider } from "react-cookie";
import { io, Socket } from "socket.io-client";
import {
  registerOnExceptionCallback,
  registerOnMessageCallback,
  registerOnSessionCallback,
  send,
  startWebsocketConnection,
} from "./components/websocket";
import moment from "moment";
import { toast, Toaster } from "react-hot-toast";
import { normalizeUsers } from "./utils/normalize-user";
import { without, map, sortBy, reverse } from "lodash";
import { getBotDetailsUrl } from "./utils/urls";
import { setLocalStorage } from "./utils/set-local-storage";
import { initialState } from "./utils/initial-states";



function App() {
  // All Users
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>();
  const [socket, setSocket] = useState<Socket>();
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentUserMessageObject, setCurrentUserMessageObject] = useState<{
    user: string;
    phoneNumber: string | null;
    messages: any[];
  }>({ user: "Farmer Bot", phoneNumber: null, messages: [] });

  const [starredMsgs, setStarredMsgs] = useState({});
  const [messages, setMessages] = useState([]);

  const botStartingMsgs = useMemo(
    () =>
      map(users, (user) => ({ id: user?.botUuid, msg: user?.startingMessage })),
    [users]
  );

  // useEffect(() => {
  //   setLocalStorage();
  // }, []);

  const [state, setState] =
    useState<{
      allMessages: {
        user: string;
        phoneNumber: string | null;
        messages: any[];
      }[];
      messages: any[];
      username: string;
      session: any;
    }>(initialState);

  useEffect(() => {
    if (localStorage.getItem("starredChats")) {
      setStarredMsgs(JSON.parse(localStorage.getItem("starredChats")));
    }
  }, []);

  // getting botList from android and fetching bot details
  useEffect(() => {
    try {
      const checkOnline = async () => {
        if (window.navigator.onLine) {
          console.log("qwe hello");
          const list = localStorage.getItem("botList");

          window &&
            window?.androidInteract?.onEvent(localStorage.getItem("botList"));
          const urls = (list ? JSON.parse(list) : []).map((botId: string) =>
            getBotDetailsUrl(botId)
          );

          const config = {
            headers: {
              "Content-Type": "application/json",
              ownerID: process.env.REACT_APP_OWNER_ID,
              ownerOrgID: process.env.REACT_APP_OwnerOrgId,
              "admin-token": process.env.REACT_APP_Admin_Token,
            },
          };

          const requests = urls.map((url: string) => axios.get(url, config));

          axios
            .all(requests)
            .then((responses) => {
              console.log("qwe:", { responses });
              const usersList = without(
                reverse(
                  sortBy(
                    responses?.map((res: any, index: number) => {
                      if (res?.data?.result) {
                        if (index === 0)
                          return normalizeUsers({
                            ...res?.data?.result,
                            active: true,
                            createTime: moment(
                              res?.data?.result?.createdAt
                            ).valueOf(),
                          });
                        else
                          return normalizeUsers({
                            ...res?.data?.result,
                            active: false,
                            createTime: moment(
                              res?.data?.result?.createdAt
                            ).valueOf(),
                          });
                      } else return null;
                    }),
                    ["createTime"]
                  )
                ),
                null
              );

              window &&
                window?.androidInteract?.onEvent(JSON.stringify(usersList));
              setUsers(usersList);
              setLoading(false);
              window?.androidInteract?.onBotDetailsLoaded(
                JSON.stringify(usersList)
              );
              if (localStorage.getItem("currentUser")) {
                setCurrentUser(JSON.parse(localStorage.getItem("currentUser")));
              } else setCurrentUser(usersList?.[0]);
            })
            .catch((err) => {
              toast.error(err?.message);
              console.log("qwe: e", { err });
              window &&
                window?.androidInteract?.onEvent(
                  `error in fetching botDetails:${JSON.stringify(err)}`
                );
            });
        } else {
          console.log("qwe byw");
          setLoading(false);
          if (localStorage.getItem("botDetails")) {
            setUsers(JSON.parse(localStorage.getItem("botDetails")));
            setCurrentUser(JSON.parse(localStorage.getItem("botDetails"))?.[0]);
          }
        }
      };
      checkOnline();
    } catch (err) {
      console.log("qwe: catch", { err });
      toast.error(err?.message);
      window &&
        window?.androidInteract?.onEvent(
          `error in fetching botList:${JSON.stringify(err)}`
        );
    }
  }, []);

  const onChangeCurrentUser = useCallback((newUser: User) => {
    console.log("qwe12:", { newUser });
    setCurrentUser({ ...newUser, active: true });
    localStorage.removeItem('userMsgs')
    setMessages([]);
  }, []);

  useEffect(() => {
    if (socket !== undefined) {
      startWebsocketConnection(socket);
    }
  }, [socket]);

  const sendMessage = useCallback(
    (text: string, media: any, isVisibile = true): void => {
      send(text, state.session, accessToken, currentUser, socket, null);
      if (isVisibile)
        if (media) {
          if (media.mimeType.slice(0, 5) === "image") {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.concat({
                username: prev.username,
                image: media.url,
                position: "right",
              }),
            }));
          } else if (media.mimeType.slice(0, 5) === "audio" && isVisibile) {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.concat({
                username: prev.username,
                audio: media.url,
                position: "right",
              }),
            }));
          } else if (media.mimeType.slice(0, 5) === "video") {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.concat({
                username: prev.username,
                video: media.url,
                position: "right",
              }),
            }));
          } else if (media.mimeType.slice(0, 11) === "application") {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.concat({
                username: prev.username,
                doc: media.url,
                position: "right",
              }),
            }));
          } else {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.concat({
                username: prev.username,
                text: text,
                doc: media.url,
                position: "right",
              }),
            }));
          }
        } else {
         
          localStorage.setItem(
            "userMsgs",
            JSON.stringify([
              ...messages,
              {
                username: state.username,
                text: text,
                position: "right",
                botUuid: currentUser?.id,
                disabled: true,
              },
            ])
          );
          
          //@ts-ignore
          setMessages((prev) => [
            ...map(prev, (prevMsg) => ({ ...prevMsg, disabled: true })),
            {
              username: state.username,
              text: text,
              position: "right",
              botUuid: currentUser?.id,
              payload: { text },
              time: moment().valueOf(),
              disabled: true,
            },
          ]);
        }
    },
    [socket, state.session, state.username, accessToken, currentUser, messages]
  );

  useEffect(() => {
    try {
      setSocket(
        io(`${process.env.REACT_APP_TRANSPORT_SOCKET_URL}`, {
          transportOptions: {
            polling: {
              extraHeaders: {
                Authorization: `Bearer ${localStorage.getItem("auth")}`,
              },
            },
          },
          query: {
            deviceId: `ucipwa:${localStorage.getItem("mobile")}`,
          },
        })
      );

      window &&
        window?.androidInteract?.onEvent(localStorage.getItem("mobile"));
      window && window?.androidInteract?.onEvent(localStorage.getItem("auth"));
    } catch (err) {
      window &&
        window?.androidInteract?.onEvent(
          `error in fetching mobile,auth:${JSON.stringify(err)}`
        );
    }
    return () => {
      //console.log("unmount");
    };
  }, []);

  const onMessageReceived = useCallback(
    (msg: any): void => {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      //  console.log("qwe12 message: ", { msg, currentUser, uu: JSON.parse(localStorage.getItem('currentUser')) });
      if (msg.content.msg_type === "IMAGE") {
          setMessages((prev) => [
          ...prev,
          {
            username: currentUser?.name,
            text: msg.content.title,
            choices: msg.content.choices,
            position: "left",
            id: user?.id,
            imageUrl: msg?.content?.media_url,
            botUuid: user?.id,
            messageId: msg?.messageId,
          },
        ]);
      } else if (msg.content.msg_type === "AUDIO") {
        
      } else if (msg.content.msg_type === "VIDEO") {
        
        setMessages((prev) => [
          ...prev,
          {
            username: currentUser?.name,
            text: msg.content.title,
            choices: msg.content.choices,
            position: "left",
            id: user?.id,
            videoUrl: msg?.content?.media_url,
            botUuid: user?.id,
            messageId: msg?.messageId,
          },
        ]);
      } else if (msg.content.msg_type === "DOCUMENT") {
        
      } else if (msg.content.msg_type === "TEXT") {
     
        setMessages((prev) => [
          ...prev,
          {
            username: currentUser?.name,
            text: msg.content.title,
            choices: msg.content.choices,
            position: "left",
            id: user?.id,
            botUuid: user?.id,
            messageId: msg?.messageId,
          },
        ]);
      }

      localStorage.setItem(
        "userMsgs",
        JSON.stringify([
          ...messages,
          {
            username: currentUser?.name,
            text: msg.content.title,
            choices: msg.content.choices,
            position: "left",
          },
        ])
      );

      //setCurrentUserMessageObject(newCurrentMessageObj);
    },
    [currentUser, messages]
  );

  const onSessionCreated = useCallback((session: { session: any }): void => {
    setState((prev) => ({
      ...prev,
      session: session,
    }));
  }, []);

  const onException = useCallback((exception: any) => {
    toast.error(exception?.message);
    window && window?.androidInteract?.onTriggerLogout();
  }, []);

  useEffect(() => {
    if (socket !== undefined && !isRegistered) {
      registerOnMessageCallback(onMessageReceived);
      registerOnSessionCallback(onSessionCreated);
      registerOnExceptionCallback(onException);
      setIsRegistered(true);
    }
  }, [isRegistered, onException, onMessageReceived, onSessionCreated, socket]);

  const values = useMemo(
    () => ({
      currentUser,
      allUsers: users,
      toChangeCurrentUser: onChangeCurrentUser,
      state,
      setState,
      sendMessage,
      messages,
      setMessages,
      starredMsgs,
      setStarredMsgs,
      loading,
      setLoading,
      botStartingMsgs,
    }),
    [currentUser, users, onChangeCurrentUser, state, sendMessage, messages, starredMsgs, setStarredMsgs, loading, setLoading, botStartingMsgs]
  );

  return (
    <Router>
      <CookiesProvider>
        <AppContext.Provider value={values}>
          <>
            <Switch>
              <Route path="/" exact>
                <Home />
              </Route>
              <Route path="/chats/:id">
                <Chats />
              </Route>
              <Route path="/starredChats" exact>
                <StarredChats />
              </Route>
              <Route path="/starredChats/:id">
                <StarredChatsPage />
              </Route>
            </Switch>
            <Toaster position="top-right" reverseOrder={false} />
          </>
        </AppContext.Provider>
      </CookiesProvider>
    </Router>
  );
}

export default App;
