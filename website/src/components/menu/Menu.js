import { useState, useEffect, useMemo } from "react";
import { throttle } from "lodash";

import { Row, Col } from "react-bootstrap";

import useWindowSize from "@/hooks/useWindowSize";

import Link from "@/components/base/link";
import Input from "@/components/base/input";
import Text from "@/components/base/text";

import styles from "./Menu.module.css";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth" });
}

export function Menu({ docs, active }) {
  return (
    <Row as="ul" className={styles.menu}>
      {/* <Col xs={12}>
        <Input className={styles.input} />
      </Col> */}
      <Col xs={12}>
        <Row as="ul" className={styles.items}>
          {docs?.map((doc, idx) => {
            const id = `${doc.name}-${idx}`;

            const isActive = id === active;
            const activeClass = isActive ? styles.active : "";

            return (
              <Col
                as="li"
                key={doc.name}
                className={`${styles.item} ${activeClass}`}
              >
                <Text type="text5">
                  <Link onClick={() => scrollTo(id)}>{doc.name}</Link>
                </Text>
              </Col>
            );
          })}
        </Row>
      </Col>
    </Row>
  );
}

export default function Wrap(props) {
  const [active, setActive] = useState();

  const onScroll = throttle(() => handleScroll(), 10);
  // const onScroll = useMemo(() => throttle(() => handleScroll(), 10), []);

  const sections = useMemo(() => {
    const container = props.containerRef.current;
    const matches = container.querySelectorAll("section[id]");

    const obj = {};
    matches.forEach((match) => {
      const top = match.offsetTop;
      const id = match.getAttribute("id");
      obj[id] = { top };
    });

    return obj;
  }, [useWindowSize()]);

  function handleScroll() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;
    const documentH = document.body.offsetHeight;
    const offset = 50;

    const first = Object.keys(sections)[0];
    const last = Object.keys(sections)[Object.keys(sections).length - 1];

    Object.entries(sections).forEach(([k, v]) => {
      if (v?.top) {
        if (k === "search-1") {
          console.log("handleScroll", scrollY, v.top - offset);
        }

        console.log("hest", windowH + scrollY, documentH, last);

        if (scrollY === 0) {
          setActive(first);
          return;
        }
        if (scrollY > v.top - offset) {
          setActive(k);
          return;
        }
        if (windowH + scrollY >= documentH) {
          setActive(last);
          return;
        }
      }
    });
  }

  useEffect(() => {
    window.addEventListener("scroll", onScroll);
    // cleanup on unMount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  console.log("sections", sections, active);

  return <Menu active={active} {...props} />;
}
