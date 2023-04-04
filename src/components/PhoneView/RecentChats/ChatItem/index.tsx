import React, { useCallback, useContext } from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { useHistory } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from './index.module.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import profilePic from '../../../../assets/images/bot_icon_2.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import crossPic from '../../../../assets/images/cross.png';
import { AppContext } from '../../../../utils/app-context';
import { User } from '../../../../types';

interface chatItemProps {
	active: boolean;
	name: string;
	phoneNumber: string | null;
	user?: User;
	isBlank?: boolean;
}

const ChatItem: React.FC<chatItemProps> = ({ active, name, phoneNumber, user, isBlank }) => {
	const history = useHistory();
	const context = useContext(AppContext);

	const fontColorToggle = useColorModeValue(styles.darkFontColor, styles.lightFontColor);

	const onChangingCurrentUserHandler = useCallback(() => {
		localStorage.setItem('currentUser', JSON.stringify(user));
		context?.toChangeCurrentUser(user);
		history.push(`/chats/${user?.id}`);
	}, [context, history, user]);

	return (
		<React.Fragment>
			<button
				onClick={onChangingCurrentUserHandler}
				disabled={isBlank}
				className={` ${active ? styles.activeContainer : styles.container}`}
			>
				<div className={styles.avatar}>
					<img
						src={!isBlank ? profilePic : crossPic}
						height={'100%'}
						width={'100%'}
						alt="profile pic"
					/>
				</div>
				<Box className={`${styles.chatItem_text}`}>
					<Box
						className={`${
							phoneNumber === null ? styles.chatItem_botName : styles.chatItem_userName
						} ${active ? styles.activeFont : fontColorToggle}`}
					>
						<p
							style={{
								textOverflow: 'ellipsis',
								maxWidth: '70vw',
								overflow: 'hidden',
								whiteSpace: 'nowrap',
								marginBottom: '0'
							}}
						>
							{name}
						</p>
					</Box>
				</Box>
			</button>
		</React.Fragment>
	);
};

export default ChatItem;
