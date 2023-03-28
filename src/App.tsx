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

const initialState: {
  allMessages: {
    user: string;
    phoneNumber: string | null;
    messages: any[];
  }[];
  messages: any[];
  username: string;
  session: any;
} = {
  allMessages: [{ user: "Farmer Bot", phoneNumber: null, messages: [] }],
  messages: [],
  username: "",
  session: {},
};

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

  useEffect(() => {
    localStorage.setItem(
      "botList",
      JSON.stringify([
        "92c409d5-96cd-499d-97bd-4e2a417db970",
        "9abdcb5a-0481-45c9-8a27-870f8fc87c19"
        // "c9d702f0-e5a8-4898-929e-58c91221a91f","345fed57-f968-474c-bdbf-3e6becf34670","cb52f4ff-b076-45c6-a12d-7e912f382a9e","98a54ca6-a54f-4beb-b45f-e836d0d202d4","1b6d01c4-e6d0-4b2a-a954-6fd420b9b77f","7feddfc1-aa59-41c2-a1e2-14a58a86ec78"
        // "d0dad28e-8b84-4bc9-92ab-f22f90c2432a",
        // "d655cf03-1f6f-4510-acf6-d3f51b488a5e",
        // "d3ed4174-3c55-4c60-b11b-facbad31a5aa",
        // "487e1d4f-a781-468e-b2ec-c83c3f2b2dee",
        // "d78eedba-334a-43c6-ae06-ae50ee264662",
        // "15ad77b1-60f9-46d7-be21-522b1e59af5b",
        // "82cfb520-1d25-47c3-81b1-d376f1d6a8a4",
        // "87301a7e-3208-4c47-95b4-306cc2ed2694",
        // "b9b4ff0d-e37d-4f51-aec2-8b8695f66ef9",
        // "806db46c-6b0f-49dd-adc7-43a1e6d04ab7",
        // "b2f94f1b-59aa-49f3-9aad-4d83c25b9f16",
        // "c22b85e5-a4ac-499e-9e51-56611fbd93e9",
        // "92de3c49-fa9b-4c2c-b445-3ddb314c3781",  
        // "c9d702f0-e5a8-4898-929e-58c91221a91f"

      ])
     );
    localStorage.setItem("mobile", "7415148877");
    //localStorage.setItem("botToFocus", "d3ed4174-3c55-4c60-b11b-facbad31a5aa");
     localStorage.setItem(
      "auth",
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRwSFNCOUYteGw5OGZLSnJ0LVEyVDV6UjQ3cyJ9.eyJhdWQiOiIzMjBiMDIwYS0zZDg0LTRkOGEtYTE5MS1kYTRlOTcyYzI5NTEiLCJleHAiOjE3MTA5OTkyNjUsImlhdCI6MTY3OTQ2MzI2NSwiaXNzIjoiYWNtZS5jb20iLCJzdWIiOiI3MTRhZDY4NC0xMmI3LTQ0YzYtYTdmMS0zMmIxNmFmMzIyMTkiLCJqdGkiOiIzOTI4NTczYi01MjMwLTQ0ODAtYThhNi1jNmZiNWM4OGEwYTciLCJhdXRoZW50aWNhdGlvblR5cGUiOiJSRUZSRVNIX1RPS0VOIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiODc2NzQ0NzQxNiIsImFwcGxpY2F0aW9uSWQiOiIzMjBiMDIwYS0zZDg0LTRkOGEtYTE5MS1kYTRlOTcyYzI5NTEiLCJ0aWQiOiIwMTA1NjZmZC1lMWNiLWM2NTgtYjY1OS1hMWQzZTA3MGJhYTgiLCJyb2xlcyI6W10sImF1dGhfdGltZSI6MTY3OTM5MjM1MSwic2lkIjoiNDdhODEyZGQtZGI2Yy00OTg4LTkyNDQtNDBjYjM1ZDE5Nzc4IiwiaHR0cHM6Ly9oYXN1cmEuaW8vand0L2NsYWltcyI6eyJ4LWhhc3VyYS1hbGxvd2VkLXJvbGVzIjpbIk9wZW5Sb2xlIiwiRElFVCIsIm1hbmF2X3NhbXBhZGEiXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiRElFVCJ9fQ.S5GNaucFUfrwoxJZXI1eZuLlWvNZlEyuwxRrK_6KAQG5jsLYaUxy07LUQJ_46Mta_dXdpQ3pj8tymDbwh8LmM6gH5gpJFGQNlOXSbkGnJP9Ko-v0cAOltiDuDvBeJCTidHoibpSrn1ZD0UQtS6b93J68PVF3L2GH3SFOUx3ZkegJnpOtW13YEJnaoCSa9QmDC7_i3REj84uDGCVRfNha0RbRx1I6074WIxeQn2Cu0KPxOv_OYnNEf2I14D8jK_D7-4N3JpvfEprOyd2OglG16nR3BYYIfdWHmLfi2cMn0rWO6Ule829vnAMb-6ZMKeTWf5fB3agXY9Fa23XcBoXfhg"
   );
  }, []);

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
          // const urls = (
          //   list
          //     ? JSON.parse(list)
          //     : [
          //         "d0dad28e-8b84-4bc9-92ab-f22f90c2432a",
          //         "d655cf03-1f6f-4510-acf6-d3f51b488a5e",
          //         "d3ed4174-3c55-4c60-b11b-facbad31a5aa",
          //         "487e1d4f-a781-468e-b2ec-c83c3f2b2dee",
          //         "d8dfcc64-be7c-4b97-ac08-f4a511a70f50",
          //       ]
          // )
          const urls = (list ? JSON.parse(list) : []).map(
            (botId: string) =>
              `${process.env.REACT_APP_UCI_BOT_BASE_URL}/admin/bot/${botId}`
          );
          console.log("qwe rrr:", { urls, list });
          const config = {
            headers: {
              "Content-Type": "application/json",
              ownerID: "8f7ee860-0163-4229-9d2a-01cef53145ba",
              ownerOrgID: "org01",
              "admin-token": "dR67yAkMAqW5P9xk6DDJnfn6KbD4EJFVpmPEjuZMq44jJGcj65",
            },
          };

          const requests = urls.map((url: string) => axios.get(url, config));

          axios
            .all(requests)
            .then((responses) => {
              console.log("qwe:", { responses });
              const usersList = without(
                reverse(sortBy(responses?.map((res: any, index: number) => {
                  if (res?.data?.result) {
                    if (index === 0)
                      return normalizeUsers({
                        ...res?.data?.result,
                        active: true,
                        createTime: moment(res?.data?.result?.createdAt).valueOf()
                      });
                    else
                      return normalizeUsers({
                        ...res?.data?.result,
                        active: false,
                        createTime: moment(res?.data?.result?.createdAt).valueOf()
                      });
                  } else return null;
                }), ["createTime"])),
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
    console.log("qwe12:", { newUser })
    setCurrentUser({ ...newUser, active: true });
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
          const newMessage = [
            // ...currentUserMessageObject.messages,
            ...state.messages,
            {
              username: state.username,
              text: text,
              position: "right",
            },
          ];

          const newCurrentMessageObj = {
            user: currentUserMessageObject.user,
            phoneNumber: currentUserMessageObject.phoneNumber,
            messages: newMessage,
          };

          const oldAllMessages = [...state.allMessages];

          const newAllMessages = oldAllMessages.filter((object) => {
            return (
              object.user !== currentUserMessageObject.user &&
              object.phoneNumber !== currentUserMessageObject.phoneNumber
            );
          });

          newAllMessages.push(newCurrentMessageObj);
          localStorage.setItem("allMessages", JSON.stringify(newAllMessages));
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
          //console.log("this is");
          //console.log(newCurrentMessageObj);
          setCurrentUserMessageObject(newCurrentMessageObj);
          // console.log("hakka:", { newAllMessages });
          setState((prev) => ({
            ...prev,
            allMessages: newAllMessages,
          }));
          //@ts-ignore
          setMessages((prev) => ([
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
          ]));
        }
    },
    [
      socket,
      state.session,
      state.messages,
      state.username,
      state.allMessages,
      accessToken,
      currentUser,
      currentUserMessageObject.user,
      currentUserMessageObject.phoneNumber,
      messages,
    ]
  );

  useEffect(() => {
    try {
      setSocket(
        io(`${process.env.REACT_APP_TRANSPORT_SOCKET_URL}`, {
          transportOptions: {
            polling: {
              extraHeaders: {
                Authorization: `Bearer ${localStorage.getItem("auth")}`,
                //  Authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRwSFNCOUYteGw5OGZLSnJ0LVEyVDV6UjQ3cyJ9.eyJhdWQiOiIzMjBiMDIwYS0zZDg0LTRkOGEtYTE5MS1kYTRlOTcyYzI5NTEiLCJleHAiOjE3MTA3Mzk4ODIsImlhdCI6MTY3OTIwMzg4MiwiaXNzIjoiYWNtZS5jb20iLCJzdWIiOiI3MTRhZDY4NC0xMmI3LTQ0YzYtYTdmMS0zMmIxNmFmMzIyMTkiLCJqdGkiOiI3OGY1NGQ2MC0xZjg5LTQ0NGEtYTdmZS0xMWU1YTIxYjcyMWQiLCJhdXRoZW50aWNhdGlvblR5cGUiOiJSRUZSRVNIX1RPS0VOIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiODc2NzQ0NzQxNiIsImFwcGxpY2F0aW9uSWQiOiIzMjBiMDIwYS0zZDg0LTRkOGEtYTE5MS1kYTRlOTcyYzI5NTEiLCJ0aWQiOiIwMTA1NjZmZC1lMWNiLWM2NTgtYjY1OS1hMWQzZTA3MGJhYTgiLCJyb2xlcyI6W10sImF1dGhfdGltZSI6MTY3OTE0ODMyOSwic2lkIjoiOGJiMjU1MjYtYjEyZC00M2RmLThiMTAtYTAwY2NhZWEzMWZmIiwiaHR0cHM6Ly9oYXN1cmEuaW8vand0L2NsYWltcyI6eyJ4LWhhc3VyYS1hbGxvd2VkLXJvbGVzIjpbIk9wZW5Sb2xlIiwiRElFVCIsIm1hbmF2X3NhbXBhZGEiXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiRElFVCJ9fQ.o9EF5BQo75X-AZfv2F7MR0J53Y5Ob7ZiWFKmho-rJq5hLcsdj2qLAwBHJydh3P66s96HDyrejdxfjN5t6HkWPA0n5bUWkieMXsPzVyATwaJCxsN8pv6MQ0-bMpGEdB03r6xy6-jFzVa32CQa_MYerO91Yn9C8Z9A11e6OcAJFvhUvaKPAimDNoYi1GvJuyEt4HitRrmjcBWpaDG4Kz7VKSLNExblzM-i-8KjuzQJ54pf2EWgPpNBRLjDeTnumyehsNohmiqwPtStCEC9Eu8prpTnps9f611qPpHukRvrYa0ZfPQ7UrUvrNMg1H1rGGD8nMlujBPwXhzw572KmaE66A`, // 'Bearer h93t4293t49jt34j9rferek...'
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
      const user = JSON.parse(localStorage.getItem('currentUser'))
    //  console.log("qwe12 message: ", { msg, currentUser, uu: JSON.parse(localStorage.getItem('currentUser')) });
      if (msg.content.msg_type === "IMAGE") {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.concat({
            username: currentUser?.name,
            text: msg.content.title,
            image: msg.content.media_url,
            choices: msg.content.choices,
            caption: msg.content.caption,
            position: "left",
          }),
        }));

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
            messageId: msg?.messageId
          },
        ]);
      } else if (msg.content.msg_type === "AUDIO") {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.concat({
            username: currentUser?.name,
            text: msg.content.title,
            audio: msg.content.media_url,
            choices: msg.content.choices,
            position: "left",
          }),
        }));
      } else if (msg.content.msg_type === "VIDEO") {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.concat({
            username: currentUser?.name,
            text: msg.content.title,
            video: msg.content.media_url,
            choices: msg.content.choices,
            position: "left",
          }),
        }));

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
            messageId: msg?.messageId
          },
        ]);
      } else if (msg.content.msg_type === "DOCUMENT") {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.concat({
            username: currentUser?.name,
            text: msg.content.title,
            doc: msg.content.media_url,
            choices: msg.content.choices,
            position: "left",
          }),
        }));
      } else if (msg.content.msg_type === "TEXT") {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.concat({
            username: currentUser?.name,
            text: msg.content.title,
            choices: msg.content.choices,
            position: "left",
          }),
        }));
        setMessages((prev) => [
          ...prev,
          {
            username: currentUser?.name,
            text: msg.content.title,
            choices: msg.content.choices,
            position: "left",
            id: user?.id,
            botUuid: user?.id,
            messageId: msg?.messageId
          },
        ]);
      }

      const newMessageList = [
        ...currentUserMessageObject.messages,
        {
          username: currentUser?.name,
          text: msg.content.title,
          choices: msg.content.choices,
          position: "left",
        },
      ];
      const newCurrentMessageObj = {
        user: currentUserMessageObject.user,
        phoneNumber: currentUserMessageObject.phoneNumber,
        messages: newMessageList,
      };
      const oldAllMessages = [...state.allMessages];

      const newAllMessages = oldAllMessages.filter((object) => {
        return (
          object.user !== currentUserMessageObject.user &&
          object.phoneNumber !== currentUserMessageObject.phoneNumber
        );
      });
  
      newAllMessages.push(newCurrentMessageObj);
      localStorage.setItem("allMessages", JSON.stringify(newAllMessages));
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

      setCurrentUserMessageObject(newCurrentMessageObj);
    },
    [currentUser, currentUserMessageObject.messages, currentUserMessageObject.phoneNumber, currentUserMessageObject.user, messages, state.allMessages]
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
      currentUserMessageObject,
      setCurrentUserMessageObject,
      state,
      setState,
      socket,
      setSocket,
      sendMessage,
      messages,
      setMessages,
      starredMsgs,
      setStarredMsgs,
      loading,
      setLoading,
    }),
    [
      currentUser,
      users,
      onChangeCurrentUser,
      currentUserMessageObject,
      state,
      socket,
      sendMessage,
      messages,
      starredMsgs,
      setStarredMsgs,
      loading,
      setLoading,
    ]
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
