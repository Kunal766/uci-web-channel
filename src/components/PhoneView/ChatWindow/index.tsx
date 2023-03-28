import React, { useState } from 'react';
import { Box, Flex, Button } from '@chakra-ui/react';
//@ts-ignore
import styles from './index.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
//@ts-ignore
import profilePic from '../../../assets/images/bot_icon_2.png';
import ChatUiWindow from './ChatUiWindow';
import { useHistory } from 'react-router-dom';
import {
  MDBContainer,
  MDBCollapse,
  MDBNavbar,
  MDBNavbarToggler,
  MDBIcon,
  MDBBtn,
} from 'mdb-react-ui-kit';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

interface chatWindowProps {
  currentUser: { name: string; number: string | null };
  setState: any;
}

const ChatWindow: React.FC<chatWindowProps> = ({ currentUser, setState }) => {
  const history = useHistory();
  const [showNavExternal3, setShowNavExternal3] = useState(false);

  const handleClick = (e) => {
    setShowNavExternal3(!showNavExternal3);
    // @ts-ignore
    toSendMessage(e, null, true, currentUser);
  };

  return (
    <Flex
      bgColor="var(--primarydarkblue)"
      flexDirection="column"
      height="100vh"
      width="100%">
      {/* Top Section */}
      <Box className={`${styles.top_section}`}>
        {/* For the back button */}
        <Box flex="1.5">
          <Button
            style={{
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '50%',
              fontSize: '14px',
            }}
            onClick={() => {
              history.push('/');
            }}
            size="sm"
            variant="ghost">
            <FontAwesomeIcon icon={faChevronLeft} />
          </Button>
        </Box>
        {/* Name and Icon  */}
        <Flex flex="9" justifyContent="space-between" alignItems="center">
          <Flex justifyContent="center" alignItems="center" width={'100%'}>
            <Box
              className={`${styles.avatarContainer} `}
              style={{ width: '100%' }}>
              {
                <>
                  <div className={styles.innerRing}>
                    <img
                      src={profilePic}
                      height={'100%'}
                      width={'100%'}
                      alt="profile pic"
                    />
                  </div>
                  <Box
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}>
                    <p
                      style={{
                        textOverflow: 'ellipsis',
                        maxWidth: '45vw',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}>
                      {currentUser?.name}
                    </p>
                    <div style={{}}>
                    <MDBNavbar>
                      <MDBContainer fluid>
                        <MDBNavbarToggler
                          className="ms-auto"
                          type="button"
                          data-target="#navbarToggleExternalContent"
                          aria-controls="navbarToggleExternalContent"
                          aria-expanded="false"
                          aria-label="Toggle navigation"
                          onClick={() =>
                            setShowNavExternal3(!showNavExternal3)
                          }>
                          <MDBIcon icon="bars" fas />
                        </MDBNavbarToggler>
                      </MDBContainer>
                    </MDBNavbar>

                    <MDBCollapse
                      show={showNavExternal3}
                      style={{
                        position: 'absolute',
                        zIndex: 10,
                        right: 0,
                        width: '60vw',
                      }}>
                      <div className="bg-light shadow-3 p-1">
                        <MDBBtn
                          block
                          className="border-bottom m-0 fs-6"
                          color="link"
                          onClick={() => handleClick('*')}>
                          सर्वे फिर से शुरू करें
                        </MDBBtn>
                        <MDBBtn
                          block
                          className="border-bottom m-0 fs-6"
                          color="link"
                          onClick={() => handleClick('#')}>
                          पिछली प्रतिक्रिया संपादित करें
                        </MDBBtn>
                      </div>
                    </MDBCollapse>
                    </div>
                  </Box>
                </>
              }
            </Box>
          </Flex>
        </Flex>
      </Box>

      {/* Chat Window */}
      <Box className={`${styles.chatWindow}`}>
        {/* NeoMorphism Box */}
        <Box className={`${styles.BackBox}`} style={{ borderRadius: '10px' }}>
          {/* Chat Area */}
          <Box style={{ height: "100%" }}>
            <ChatUiWindow currentUser={currentUser} setState={setState} />
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default ChatWindow;
