import React, { useContext, useEffect } from "react";
//@ts-ignore
import styles from "./index.module.css";
import { Box, Flex, Button } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import ChatItem from "./ChatItem";
import { useHistory } from "react-router-dom";
import { AppContext } from "../../../utils/app-context";
import { find } from "lodash";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import toast from "react-hot-toast";
interface recentChatsProps {
  allUsers: { name: string; number: string | null; active: boolean }[];
}

const RecentChats: React.FC<recentChatsProps> = ({
  allUsers
}) => {
  const history = useHistory();
  const [botToFocus] = useLocalStorage("botToFocus", "");

  const context = useContext(AppContext);

  const StarredViewHandler = () => {
    history.push("/starredChats");
  };

  useEffect(() => {
    try {
      if (botToFocus) {
        const bot = find(allUsers, { id: botToFocus });
        if (bot) {
          localStorage.removeItem("botToFocus");
          //@ts-ignore
          history.push(`/chats/${bot?.id}`);
        }
      }
    } catch (err) {
      toast.error(err.message);
    }
  }, [history, allUsers, botToFocus]);

  useEffect(() => {
    setTimeout(() => {
      context?.setLoading(false);
      if (document.getElementById("loader")) {
        document.getElementById("loader").setAttribute("display", "none");
        toast.error(
          "चैटबॉट जवाब नहीं दे पा रहा हैं। कृपया बाद में पुन: प्रयास करें।"
        );
      }
    }, 60000);
  }, [context]);

  return (
    <Flex flexDirection="column" height="100vh">
      {/* Top Section */}
      <Box className={`${styles.top_section}`}>
        {/* For the back button */}
        <Box flex="1.5">
          <Button
            style={{
              border: "none",
              padding: "0.75rem 1rem",
              borderRadius: "50%",
              fontSize: "14px",
            }}
            onClick={() => {
              try {
                window && window?.androidInteract?.onDestroyScreen();
              } catch (err) {
                window &&
                  window?.androidInteract?.onEvent(
                    `error in destroying screen:${JSON.stringify(err)}`
                  );
              }
            }}
            size="sm"
            variant="ghost"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </Button>
        </Box>
        <Flex flex="9" justifyContent="space-between" alignItems="center">
          <Flex justifyContent="center" alignItems="center">
            <Box>{<Box>Chats</Box>}</Box>
          </Flex>
        </Flex>
      </Box>

      <Box className={styles.mainContainer}>
        <Box className={`${styles.backBox}`}>
          <button className={`${styles.starred}`} onClick={StarredViewHandler}>
            Starred Messages
          </button>
          <Box className={styles.chatList}>
            {context?.loading ? (
              <div id="loader" className={`${styles.spinner}`}></div>
            ) : (
              <>
                {allUsers.length > 0 ? (
                  <>
                    {(allUsers ?? [])?.map((user, index) => {
                      return (
                        <ChatItem
                          key={index}
                          active={user.active}
                          name={user.name}
                          phoneNumber={user.number}
                          user={user}
                        />
                      );
                    })}
                  </>
                ) : (
                  <ChatItem
                    key={0}
                    active={false}
                    name={"No Chats Available"}
                    phoneNumber={""}
                    isBlank
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default RecentChats;
