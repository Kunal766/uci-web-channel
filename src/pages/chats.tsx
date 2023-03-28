import React, { useContext, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import ChatWindow from "../components/PhoneView/ChatWindow";
import { AppContext } from "../utils/app-context";

const Chats = () => {
  const { id } = useParams<{ id: string }>();
  const context = useContext(AppContext);

  const history = useHistory();
  useEffect(() => {
    if (!id) history.push("/");
  }, [history, id]);

  useEffect(() => {
    window && window?.androidInteract?.onBotListingScreenFocused(false);
    window &&
      window?.androidInteract?.onEvent(
        `On Home Page onBotListingScreenFocused:false triggered`
      );
  }, []);

  return (
    <ChatWindow
      currentUser={context?.currentUser}
      setState={context?.setState}
    />
  );
};

export default Chats;
