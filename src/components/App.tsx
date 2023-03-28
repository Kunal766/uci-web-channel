import { useEffect, useContext } from "react";
import "../styles/globals.css";
import { AppContext } from "../utils/app-context";
import { filter } from "lodash";
import RecentChats from "./PhoneView/RecentChats";
interface appProps {
  currentUser: { name: string; number: string | null };
  allUsers: { name: string; number: string | null; active: boolean }[];
  toChangeCurrentUser: (arg: { name: string; number: string | null }) => void;
}

const App: React.FC<appProps> = () => {
  const { currentUser, allUsers, setState, setMessages } =
    useContext(AppContext);

  useEffect(() => {
    try {
      const retrievedMessages: {
        user: string;
        phoneNumber: string | null;
        messages: any[];
      }[] = JSON.parse(localStorage.getItem("allMessages") || "") || [];

      const userMsgsFromLocal = JSON.parse(localStorage.getItem("userMsgs"));
      if (retrievedMessages.length !== 0) {
        setState((prev) => ({
          ...prev,
          allMessages: retrievedMessages,
        }));
      }
      if (userMsgsFromLocal?.length > 0) {
        const userMsgs = filter(userMsgsFromLocal, {
          botUuid: currentUser?.id,
        });

        // setMessages(retrievedMessages);
        setMessages(userMsgs);
      }
      window &&
        window?.androidInteract?.onEvent(
          localStorage.getItem("allMessages") || ""
        );
    } catch (err) {
      window &&
        window?.androidInteract?.onEvent(
          `error in fetching allMessages:${JSON.stringify(err)}`
        );
    }
  }, [setState, setMessages, currentUser?.id]);

  return (
    <RecentChats
      allUsers={allUsers}
    />
  );
};

export default App;
