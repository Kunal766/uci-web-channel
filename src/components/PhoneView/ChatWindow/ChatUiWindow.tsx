import Chat from '@chatui/core';
import '@chatui/core/dist/index.css';
import axios from 'axios';
import React, {
	FC,
	ReactElement,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';

import { filter, find } from 'lodash';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../../utils/app-context';
import { RenderComp } from './Comps';

import { getConvHistoryUrl } from '../../../utils/urls';
import { getMsgType } from '../../../utils/get-msg-type';
import { normalizedChat } from '../../../utils/normalize-chats';
import FullScreenLoader from '../../FullScreenLoader';

const ChatUiWindow: FC<{
	currentUser: any;
}> = ({ currentUser }) => {
	const [loading, setLoading] = useState(true);
	const context = useContext(AppContext);

	// useEffect(() => {
	// 	setTimeout(() => setLoading(false), 400);
	// }, []);
	const chatUIMsg = useMemo(
		() =>
			context?.messages?.map((msg: any) => ({
				type: getMsgType(msg),
				content: { text: msg?.text, data: { ...msg } },
				position: msg?.position ?? 'right'
			})),
		[context?.messages]
	);

	const sendMessage = useCallback(() => {
		context?.sendMessage(currentUser?.startingMessage, null, false, currentUser);
	}, [context, currentUser]);

	const setMessages = useCallback(
		(msgs: Array<any>) => {
			context?.setMessages(msgs);
		},
		[context]
	);
	const conversationHistoryUrl = useMemo(
		() => (context?.currentUser ? getConvHistoryUrl(context?.currentUser) : null),
		[context?.currentUser]
	);
	// console.log('qwers12:', { conversationHistoryUrl, user: context?.currentUser });
	useEffect(() => {
		const phone = localStorage.getItem('mobile');
		if (phone === '') toast.error('Mobile Number required');
		if (navigator.onLine) {
			if (conversationHistoryUrl)
				axios
					.get(conversationHistoryUrl)
					.then((res) => {
						setLoading(false);
						// console.log('qwer123:', { res });
						if (res?.data?.result?.records?.length > 0) {
							const normalizedChats = normalizedChat(res.data.result.records);
							// console.log('qw12:', { normalizedChats });
							window && window?.androidInteract?.log(JSON.stringify(normalizedChats));
							//  setState((prev: any) => ({ ...prev, messages: normalizedChats }));
							localStorage.setItem('userMsgs', JSON.stringify(normalizedChats));
							// context?.setMessages(normalizedChats);
							setMessages(normalizedChats);
						} else {
							sendMessage();
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							// context?.sendMessage(currentUser?.startingMessage, null, false, currentUser);
						}
					})
					.catch((err) => {
						setLoading(false);
						console.error('cvbn:', err);
						toast.error(JSON.stringify(err?.message));
						window &&
							window?.androidInteract?.log(
								`error in fetching chat history(online):${JSON.stringify(err)}`
							);
					});
		} else {
			setLoading(false);
			try {
				if (localStorage.getItem('chatHistory')) {
					const offlineMsgs = filter(
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						JSON.parse(localStorage.getItem('chatHistory')),
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						{ botUuid: JSON.parse(localStorage.getItem('currentUser'))?.id }
					);
					window && window?.androidInteract?.log(localStorage.getItem('chatHistory'));
					// setState((prev: any) => ({
					//   ...prev,
					//   messages: JSON.parse(localStorage.getItem("chatHistory")),
					// }));
					// context?.setMessages(offlineMsgs);
					setMessages(offlineMsgs);
				}
			} catch (err) {
				window &&
					window?.androidInteract?.log(
						`error in getting chat history(offline):${JSON.stringify(err)}`
					);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conversationHistoryUrl]);

	useEffect(() => {
		try {
			window &&
				window?.androidInteract?.onChatCompleted?.(
					String(currentUser?.id),
					JSON.stringify(context?.state?.messages)
				);
			window && window?.androidInteract?.log(JSON.stringify(context?.state?.messages));
		} catch (err) {
			window &&
				window?.androidInteract?.log(`error in onChatCompleted func:${JSON.stringify(err)}`);
		}
	}, [context?.state?.messages, currentUser?.id]);

	const handleSend = useCallback(
		(type: string, val: any) => {
			if (type === 'text' && val.trim()) {
				if (
					find(context?.botStartingMsgs, { msg: val.trim() }) &&
					find(context?.botStartingMsgs, { msg: val.trim() })?.id !== currentUser?.botUuid
				) {
					toast.error('action not allowed');
				} else {
					context?.sendMessage(val, null, true, currentUser);
				}
			}
		},
		[context, currentUser]
	);

	return (
		<>
			<FullScreenLoader loading={loading} />
			<Chat
				messages={chatUIMsg}
				renderMessageContent={(props): ReactElement => (
					<RenderComp
						key={props}
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
