import * as React from "react";
import useUser from "../lib/useUser";
import Layout from "../components/Layout";
import { IUser } from "../types/IUser";
import { Button, Paper, Snackbar } from "@material-ui/core";
import { useEffect, useState } from "react";
import TextField from "@material-ui/core/TextField";
import { DateTimePicker } from "@material-ui/pickers";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import axios from "axios";
import { Alert, Skeleton } from "@material-ui/lab";
import { Opportunity, User } from "@prisma/client";
import { format } from "date-fns";
import Divider from "@material-ui/core/Divider";
import { Theme, withStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogContent from "@material-ui/core/DialogContent";

const Home = (): JSX.Element => {
  let data = useUser({ redirectTo: "/login" });
  let user: IUser = data.user;
  const [selectedDate, handleDateChange] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>("");

  const [
    isOpportunityCreatedMessageOpen,
    setIsOpportunityCreatedMessageOpen,
  ] = useState(false);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [isRequestingATime, setIsRequestingATime] = useState(false);
  const [myRequestedTimes, setMyRequestedTimes] = useState<
    (Opportunity & {
      babySitter: User;
    })[]
  >([]);
  const [myOpportunities, setMyOpportunities] = useState<
    (Opportunity & {
      requestedByUser: User;
      babySitter: User;
    })[]
  >([]);

  useEffect(() => {
    if (user == null || user.id == undefined) return;
    refreshOpportunityData();
  }, [user]);

  async function refreshOpportunityData() {
    setIsLoadingOpportunities(true);
    const myRequestTimesResponse = await axios.get(`/api/opportunities`);
    setMyRequestedTimes(myRequestTimesResponse.data.requestedTimes);
    setMyOpportunities(myRequestTimesResponse.data.opportunities);
    setIsLoadingOpportunities(false);
  }

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setIsOpportunityCreatedMessageOpen(false);
  };

  if (!user || user.isLoggedIn === false) {
    return <Layout>loading...</Layout>;
  }

  const handleSubmit = async () => {
    setIsRequestingATime(false);
    try {
      await axios.post("/api/new-opportunity", {
        date: selectedDate,
        notes: notes,
      });
      setIsOpportunityCreatedMessageOpen(true);
      setNotes("");
      handleDateChange(null);
      refreshOpportunityData();
    } catch (error) {
      console.log("error adding opportunity:", error);
    }
  };

  const handleVolunteer = async (opportunityId: number) => {
    await axios.post("/api/volunteer-for-opportunity", {
      opportunityId,
    });
    refreshOpportunityData();
  };

  const cancelOpportunity = async (opportunityId: number) => {
    await axios.post("/api/cancel-opportunity", {
      opportunityId,
    });
    refreshOpportunityData();
  };

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Layout>
        <Paper
          elevation={3}
          style={{
            padding: 15,
            backgroundColor: "rgb(28 29 33)",
            marginTop: 20,
          }}
        >
          <h1 className="title">Your friends times</h1>
          {isLoadingOpportunities && (
            <div style={{ width: 300 }}>
              <Skeleton style={{ height: 50 }} />
              <Skeleton style={{ height: 50 }} />
              <Skeleton style={{ height: 50 }} />
            </div>
          )}
          {myOpportunities.length === 0 && !isLoadingOpportunities && (
            <p style={{ margin: 0, padding: 0, color: "rgb(204 204 204)" }}>
              You don't have any opportunities
            </p>
          )}
          {myOpportunities.map((opportunity) => {
            return (
              <div key={opportunity.id} style={{ marginTop: 10 }}>
                <p
                  className={
                    opportunity.babysitterId == user.id
                      ? "dateTitle userIsBabysitting"
                      : "dateTitle"
                  }
                >
                  {format(new Date(opportunity.date), "LLL do h:mmaaa")}
                </p>
                <p
                  style={{
                    margin: 0,
                    padding: 0,
                    marginTop: 2,
                    color: "rgb(204 204 204)",
                  }}
                >
                  Requested by{" "}
                  <strong>{opportunity.requestedByUser.name}</strong>
                </p>
                {opportunity.notes !== null && (
                  <p style={{ margin: 0, padding: 0 }}>{opportunity.notes}</p>
                )}
                {opportunity.babySitter !== null && (
                  <p style={{ margin: 0, padding: 0, marginTop: 2 }}>
                    {opportunity.babysitterId == user.id ? (
                      <span>
                        <strong>You</strong> are babysitting.
                      </span>
                    ) : (
                      <span>
                        {" "}
                        <strong>{opportunity.babySitter.name}</strong> is
                        babysitting.
                      </span>
                    )}
                  </p>
                )}
                {opportunity.babySitter === null && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={(e) => handleVolunteer(opportunity.id)}
                    style={{
                      marginBottom: 0,
                      marginTop: 5,
                      color: "#8cebf3",
                    }}
                  >
                    Volunteer
                  </Button>
                )}
                <Divider style={{ marginTop: 10, width: 320 }} />
              </div>
            );
          })}
        </Paper>

        <Paper
          elevation={3}
          style={{
            padding: 15,
            backgroundColor: "rgb(28 29 33)",
            marginTop: 20,
            marginBottom: 100,
          }}
        >
          <h1 className="title">Your times</h1>
          <Button
            variant="outlined"
            style={{ marginBottom: 10 }}
            onClick={() => setIsRequestingATime(true)}
          >
            Request a time
          </Button>
          <Snackbar
            open={isOpportunityCreatedMessageOpen}
            autoHideDuration={6000}
            onClose={handleClose}
          >
            <Alert onClose={handleClose} severity="success">
              Oppertunity created! You will recieve an email when/if someone
              says they can babysit for you.
            </Alert>
          </Snackbar>
          <Dialog
            onClose={() => setIsRequestingATime(false)}
            aria-labelledby="customized-dialog-title"
            open={isRequestingATime}
          >
            <DialogContent dividers>
              <div>
                <h2 style={{ marginTop: 0, paddingTop: 0 }}>
                  Enter a time you want free
                </h2>
                <DateTimePicker
                  label="Date/Time"
                  inputVariant="outlined"
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={{ maxWidth: 300, display: "block" }}
                  disablePast
                  fullWidth
                />
                <TextField
                  variant="outlined"
                  label="Notes/Comments"
                  style={{ marginTop: 20, maxWidth: 300, display: "block" }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                ></TextField>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  size="medium"
                  style={{ marginTop: 10, display: "block" }}
                  disabled={selectedDate == null}
                >
                  Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {isLoadingOpportunities && (
            <div style={{ width: 300 }}>
              <Skeleton style={{ height: 50 }} />
              <Skeleton style={{ height: 50 }} />
              <Skeleton style={{ height: 50 }} />
            </div>
          )}
          {myRequestedTimes.length === 0 && !isLoadingOpportunities && (
            <p style={{ margin: 0, padding: 0, color: "rgb(204 204 204)" }}>
              You don't have any requested dates
            </p>
          )}
          {myRequestedTimes.map((time) => {
            return (
              <div key={time.id} style={{ marginTop: 10 }}>
                <p className="dateTitle">
                  {format(new Date(time.date), "LLL do h:mmaaa")}
                </p>
                {time.notes !== null && (
                  <p style={{ margin: 0, padding: 0 }}>{time.notes}</p>
                )}
                {time.babySitter !== null && (
                  <p
                    style={{
                      margin: 0,
                      padding: 0,
                      color: "rgb(204, 204, 204)",
                    }}
                  >
                    {time.babySitter.name} is babysitting.
                  </p>
                )}
                {time.babySitter === null && (
                  <p
                    style={{
                      margin: 0,
                      padding: 0,
                      color: "rgb(204, 204, 204)",
                    }}
                  >
                    No one has volunteered for this yet.
                  </p>
                )}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => cancelOpportunity(time.id)}
                  style={{
                    marginBottom: 0,
                    marginTop: 5,
                    color: "rgb(255 102 102)",
                  }}
                >
                  Cancel
                </Button>
                <Divider style={{ marginTop: 10, width: 320 }} />
              </div>
            );
          })}
        </Paper>
      </Layout>
      <style jsx>{`
        .userIsBabysitting {
          font-weight: 900;
        }
        .title {
          margin: 0px;
          padding: 0px;
        }
        .dateTitle {
          font-size: 20px;
          margin: 0px;
          padding: 0px;
        }
        @media (max-width: 600px) {
          .title {
            font-size: 24px;
          }
          .dateTitle {
            font-size: 16px;
          }
        }
      `}</style>
    </MuiPickersUtilsProvider>
  );
};

const DialogContent = withStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

export default Home;
