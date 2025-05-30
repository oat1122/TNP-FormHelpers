import { useState, useEffect } from 'react';
import { Col, Row } from "react-bootstrap";
import { Chip, styled } from "@mui/material";
import { PiClockClockwise } from "react-icons/pi";
import { CgTimelapse } from "react-icons/cg";
import { useResetTimeMutation } from '../api/slice';
import Swal from "sweetalert2";

const ResetTimeIcon = styled(PiClockClockwise)({
  fontSize: '1.5rem',
});

const CountTimeIcon = styled(CgTimelapse)({
  fontSize: "1.35rem",
});

function CountdownTimer({ data }) {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [resetTime] = useResetTimeMutation();
  
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  useEffect(() => {
    
    // Update the count down every 1 second
    const intervalId = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // empty dependency array to run effect only once

  // Function to calculate time remaining
  function getTimeRemaining() {
    const now = new Date().getTime();
    const distance = (new Date(data.end_select_process_time).getTime()) - now;
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    return {
      hours,
      minutes,
      seconds,
      expired: distance < 0,
    };
  }

  const handleResetTime = () => {

    resetTime(data.pd_id)
    .then( async (response) => {
      await Swal.fire({
        icon: "success",
        title: response.data.message,
        showConfirmButton: false,
        timer: 1500,
      });

    }).catch((error) => {
      Swal.fire({
        icon: "error",
        title: "Errorr",
        text: error.message,
      });
    })
  }

  const countDownLabel = `${timeRemaining.hours}h ${timeRemaining.minutes}m`;

  return (
    <Row className='my-3 text-center'>
      <Col>
      {timeRemaining.expired ? (
          <Chip color="error" label="Please Start This Work" className='blinking fw-bold' sx={{textTransform: 'uppercase'}} />
        ) : (
          <Chip icon={<CountTimeIcon />} color="error" label={countDownLabel} variant="outlined" />
       
        )}
        {user.role === 'manager' && (
          <Chip icon={<ResetTimeIcon />} color="error" label="Reset" variant="outlined" onClick={handleResetTime} sx={{marginLeft: 1}} />
        )}
      </Col>
    </Row>
  );
};

export default CountdownTimer;
