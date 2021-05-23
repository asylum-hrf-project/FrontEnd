import React, { useState, useEffect, useContext } from 'react';
import CaseTable from '../CaseTable/CaseTable';
import JudgeTable from '../JudgeTable/JudgeTable';
import UploadCase from '../Upload/UploadCase';
import SideDrawer from '../SideDrawer/SideDrawer';
import MainHeader from '../Home/MainHeader';
import JudgePage from '../JudgePage/JudgePage';
import CaseOverview from '../CaseOverview/CaseOverview';
import MyCases from '../MyCases/MyCases';
import DataHub from '../DataHub/DataHub';
import { Route } from 'react-router-dom';
import {
  makeStyles,
  ThemeProvider,
  createMuiTheme,
} from '@material-ui/core/styles';
import { UserContext } from '../../../context/UserContext';

import axios from 'axios';
import SavedCases from '../SavedCases/SavedCases';
import SavedJudges from '../SavedJudges/SavedJudges';

// Imports for loading spinner
import { trackPromise } from 'react-promise-tracker';
import { usePromiseTracker } from 'react-promise-tracker';
import Loader from 'react-promise-loader';
import CaseUpdate from '../CaseOverview/CaseUpdate';
import ManageCases from '../ManageCases/ManageCases';
import AccountPage from '../AccountPage/AccountPage';
import SupportPage from '../SupportPage/SupportPage';
import ManageUsersPage from '../AdminTools/ManageUsers';
import EditUserPage from '../AdminTools/EditUser';
import AddFaq from '../AdminTools/AddFaq';
import ManageFaqPage from '../AdminTools/ManageFaq';
import EditFaqPage from '../AdminTools/EditFaq';

// Global styling for MUI components
import Lato from '../../../styles/Lato-Font.woff2';

const lato = {
  fontFamily: 'Lato',
  fontStyle: 'normal',
  fontDisplay: 'swap',
  fontWeight: 400,
  src: `
    local('Lato'),
    local('Lato-Regular'),
    url(${Lato}) format('woff2')
  `,
  unicodeRange:
    'U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF',
};

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'row',
  },
  subContainer: {
    width: '100%',
  },
});

const theme = createMuiTheme({
  typography: {
    fontFamily: 'Lato, san-serif',
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '@font-face': [lato],
      },
    },
  },
});

function RenderHomePage(props) {
  const [caseData, setCaseData] = useState([]);
  const [judgeData, setJudgeData] = useState([]);
  const [savedCases, setSavedCases] = useState([]);
  const [savedJudges, setSavedJudges] = useState([]);
  const [selectedRows, setSelectedRows] = useState({});
  const [hrfUserInfo, setHrfUserInfo] = useState([]);
  const [myPendingCases, setMyPendingCases] = useState([]);
  const user = useContext(UserContext);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URI}/cases`, {
        headers: {
          Authorization: 'Bearer ' + user.authState.idToken.idToken,
        },
      })
      .then(res => {
        setCaseData(
          res.data.map(eachCase => {
            return {
              ...eachCase,
              id: eachCase.case_number,
            };
          })
        );
      })
      .catch(err => {
        console.log(err);
      });
  }, [user.authState.idToken.idToken]);

  useEffect(() => {
    trackPromise(
      // Tracks the axios call and implements spinning loader while executing
      axios.get(`${process.env.REACT_APP_API_URI}/judge`, {
        headers: {
          Authorization: 'Bearer ' + user.authState.idToken.idToken,
        },
      })
    )
      .then(res => {
        setJudgeData(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }, [user.authState.idToken.idToken]);

  useEffect(() => {
    trackPromise(
      axios.get(
        `${process.env.REACT_APP_API_URI}/profile/${user.userInfo.sub}`,
        {
          headers: {
            Authorization: 'Bearer ' + user.authState.idToken.idToken,
          },
        }
      )
    )
      .then(res => {
        window.localStorage.setItem('role', res.data.role);
        setHrfUserInfo(res.data);
        setSavedCases(res.data.case_bookmarks);
        setSavedJudges(res.data.judge_bookmarks);
      })
      .catch(err => {
        console.log(err);
      });
  }, [
    user.authState.idToken.idToken,
    user.userInfo.sub,
    savedJudges.length,
    // savedCases.length,
  ]);

  const getPendingCases = () => {
    trackPromise(
      axios.get(
        `${process.env.REACT_APP_API_URI}/pendingCases/:${user.userInfo.sub}`,
        {
          headers: {
            Authorization: 'Bearer ' + user.authState.idToken.idToken,
          },
        }
      )
    )
      .then(res => {
        setMyPendingCases(
          res.data.map(eachCase => {
            return {
              ...eachCase,
              id: eachCase.pending_case_id,
            };
          })
        );
      })
      .catch(err => {
        console.log(err);
      });
  };
  const deleteFromStateById = (id, state, setState) => {
    // i made this function non case specific but now I'm remembering that cases get deleted by name
    let index = state.findIndex(item => item.id === id);
    return setState(state.slice(0, index).concat(state.slice(index + 1)));
  };

  const deleteBookmark = caseID => {
    // only works for cases, judge requires name instead of ID to delete
    axios
      .delete(
        `${process.env.REACT_APP_API_URI}/profile/${user.userInfo.sub}/case/${caseID}`,
        {
          headers: {
            Authorization: 'Bearer ' + user.authState.idToken.idToken,
          },
        }
      )
      .then(res => {
        deleteFromStateById(caseID, savedCases, setSavedCases);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const deleteSavedJudge = judge_id => {
    axios
      .delete(
        `${process.env.REACT_APP_API_URI}/profile/${user.userInfo.sub}/judge/${judge_id}`,
        {
          headers: {
            Authorization: 'Bearer ' + user.authState.idToken.idToken,
          },
        }
      )
      .then(res => {
        setSavedJudges(res.data.judge_bookmarks);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const logout = () => {
    window.localStorage.removeItem('role');
    user.oktaAuth.signOut();
  };

  const classes = useStyles();

  return (
    <>
      <MainHeader logout={logout} />
      <div className={classes.container}>
        <ThemeProvider theme={theme}>
          <SideDrawer
            logout={logout}
            userInfo={user.userInfo}
            MyCases={MyCases}
            savedCases={savedCases}
            savedJudges={savedJudges}
            deleteBookmark={deleteBookmark}
            deleteSavedJudge={deleteSavedJudge}
          />
          <div className={classes.subContainer}>
            <UploadCase
              authState={user.authState}
              getPendingCases={getPendingCases}
            />
            <Route exact path="/my-cases">
              <MyCases
                user={user}
                myPendingCases={myPendingCases}
                getPendingCases={getPendingCases}
              />
            </Route>
            <Route exact path="/saved-cases">
              <SavedCases
                savedCases={savedCases}
                deleteBookmark={deleteBookmark}
              />
            </Route>
            <Route exact path="/saved-judges">
              <SavedJudges
                savedJudges={savedJudges}
                deleteSavedJudge={deleteSavedJudge}
              />
            </Route>
            <Route exact path="/judge/:judge_id">
              <JudgePage
                // clicking on a Judge should bring you to a url with their name in it
                // get request to get details of that judge
                authState={user.authState}
              />
            </Route>
            <Route exact path="/case/:id" authState={user.authState}>
              {/* clicking on a case name will bring you to a page where more indepth information
      about the case can be viewed, this page is linked to the cooresponding judge's page
      this page also links to the update case file which is not operational yet, see notation
      on CaseOverview & CaseUpdate for details */}
              <CaseOverview
                setCasesData={setCaseData}
                authState={user.authState}
                casesData={caseData}
              />
            </Route>
            <Route exact path="case/:id/update" authState={user.authState}>
              <CaseUpdate />
            </Route>
            <Route exact path="/manage-cases">
              <ManageCases />
            </Route>
            <Route exact path="/account">
              <AccountPage
                oktaUserInfo={user.userInfo}
                hrfUserInfo={hrfUserInfo}
              />
            </Route>
            <Route exact path="/support">
              <SupportPage authState={user.authState} userInfo={hrfUserInfo} />
            </Route>
            <Route exact path="/manage-users">
              <ManageUsersPage authState={user.authState} />
            </Route>
            <Route exact path="/edit-user/:id">
              <EditUserPage authState={user.authState} />
            </Route>
            <Route exact path="/add-faq">
              <AddFaq authState={user.authState} />
            </Route>
            <Route exact path="/manage-faq">
              <ManageFaqPage authState={user.authState} />
            </Route>
            <Route exact path="/edit-faq/:faq_id">
              <EditFaqPage authState={user.authState} />
            </Route>

            <Route exact path="/">
              <DataHub caseData={caseData} />
            </Route>

            <Route exact path="/cases">
              <>
                <CaseTable
                  caseData={caseData}
                  userInfo={user.userInfo}
                  savedCases={savedCases}
                  setSavedCases={setSavedCases}
                  authState={user.authState}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                />
                <Loader promiseTracker={usePromiseTracker} />
              </>
            </Route>

            <Route exact path="/judges">
              <>
                <JudgeTable
                  judgeData={judgeData}
                  userInfo={user.userInfo}
                  savedJudges={savedJudges}
                  setSavedJudges={setSavedJudges}
                  authState={user.authState}
                />
                <Loader promiseTracker={usePromiseTracker} />
              </>
            </Route>
          </div>
        </ThemeProvider>
      </div>
    </>
  );
}
export default RenderHomePage;
