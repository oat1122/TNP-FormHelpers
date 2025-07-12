import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Container, Row } from "react-bootstrap";
import { useGetAllSheetsQuery } from "../../api/slice";
import AppFilter from "./AppFilter";
import "./GridCard.css";
import { useSelector } from "react-redux";
import RenderedCard from "./CardShow";

function GridCard() {
  const { data, error, isLoading } = useGetAllSheetsQuery();
  const keyword = useSelector((state) => state.global.keyword);
  const user = JSON.parse(localStorage.getItem("userData"));
  const [cardLimit, setCardLimit] = useState(4);
  const [filters, setFilters] = useState({
    selectAll: true,
    notStarted: false,
    inProgress: false,
    owner: false,
    dateNull: false,
    shirtCate: '1',
    done: false
  });

  const observer = useRef();
  const lastCardRef = useRef();

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCardLimit(4);
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data
      .filter((row) => {
        const { selectAll, notStarted, inProgress, owner, dateNull, shirtCate, done } = filters;

        // Filter only card status not started
        const isNotStarted = notStarted && row.status === 0;

        // Filter only card status in progress
        const isInProgress = inProgress && row.status === 1;

        // Filter only owner work card
        const isOwner = owner && row.username === user.username;

        // Filter only card date value in null
        const isDateNull =
          dateNull &&
          row.status === 1 &&
          [
            "order_start",
            "order_end",
            "dyeing_start",
            "dyeing_end",
            "cutting_start",
            "cutting_end",
            "sewing_start",
            "sewing_end",
            "received_start",
            "received_end",
            "exam_start",
            "exam_end",
          ].some((key) => !row[key]);

          const isAllShirt = shirtCate === '1';

          // Filter only card t-shirt
          const isTshirt = shirtCate === '2' && row.product_category === 'T-Shirt';
          
          // Filter only card polo shirt
          const isPoloShirt = shirtCate === '3' && row.product_category === 'Polo Shirt';

          const isDone = done && row.status === 2;

        return (
          (isAllShirt || isTshirt || isPoloShirt) &&
          (selectAll || isNotStarted || isInProgress || isOwner || isDateNull || isDone)
        );
      })
      .filter((row) => {
        
        const isSaleAndNotStarted = user.role === "sale" && row.status === 0;
        const isNotSaleAndNotFinished = user.role !== "sale" && row.status !== 2;
        const isSaleAndInProgress = user.role === "sale" && row.status === 1;
        const isSaleAndDone = user.role === "sale" && row.status === 2;
        const isFinished = (user.role === "admin" || user.role === "manager") && row.status === 2;
        const searchWorkName = row.work_name.toLowerCase().includes(keyword.toLowerCase()); 
        const searchUserName = row.username.toLowerCase().includes(keyword.toLowerCase()); 

        return (
          (isSaleAndNotStarted || isNotSaleAndNotFinished || isSaleAndInProgress || isSaleAndDone || isFinished) && (searchWorkName || searchUserName)
        );
      });
  }, [data, filters, user.username, user.role, keyword]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && filteredData && filteredData.length > cardLimit) {
          setCardLimit((prev) => prev + 8);
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
    
    if (lastCardRef.current) {
      observer.current.observe(lastCardRef.current);
    }
    
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [cardLimit, filteredData?.length, filters.notStarted, filters.inProgress, filters.owner, filters.dateNull, filters.done]);

  return (
    <Container className="grid-card">
      <AppFilter onFiltersChange={handleFiltersChange} />
      <Row
        xs={1}
        md={2}
        xl={3}
        xxl={4}
        className="g-4 mt-2 mt-md-0 mx-auto"
      >
        {error ? (
          <div className="w-100 text-center py-5">
            <h3 className="text-muted">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <p className="text-secondary">กรุณาลองใหม่อีกครั้ง</p>
          </div>
        ) : filteredData && filteredData.length > 0 ? (
          <>
            {filteredData.slice(0, cardLimit).map((row, index) => (
              <div
                key={row.pd_id}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animation: 'fadeInUp 0.4s ease forwards',
                  opacity: 0
                }}
              >
                <RenderedCard data={row} />
              </div>
            ))}
            {filteredData.length > cardLimit && (
              <div 
                className="w-100 text-center py-3" 
                ref={lastCardRef}
              >
                <p className="text-muted mb-0">เลื่อนลงเพื่อดูข้อมูลเพิ่มเติม</p>
              </div>
            )}
          </>
        ) : (
          <div className="w-100 text-center py-5">
            <h3 className="text-muted">ไม่พบข้อมูลเวิร์กชีต</h3>
            <p className="text-secondary">ลองปรับเปลี่ยนตัวกรองหรือสร้างเวิร์กชีตใหม่</p>
          </div>
        )}
      </Row>
    </Container>
  );
}

export default GridCard;
