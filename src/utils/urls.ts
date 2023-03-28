import moment from "moment";

export const Conversation_History_Url =`${
    process.env.REACT_APP_CHAT_HISTORY_URL
  }/xmsg/conversation-history?provider=pwa&endDate=${moment().format(
    "DD-MM-YYYY"
  )}&startDate=19-03-2023&botId=${
    JSON.parse(localStorage.getItem("currentUser"))?.id
  }&userId=${`ucipwa:${localStorage.getItem("mobile")}`}`;


  export const getBotDetailsUrl=(botId)=>`${process.env.REACT_APP_UCI_BOT_BASE_URL}/admin/bot/${botId}`
