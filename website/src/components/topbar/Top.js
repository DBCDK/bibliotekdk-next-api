import { useRouter } from "next/router";
import { Container, Row, Col } from "react-bootstrap";

import useToken from "@/hooks/useToken";

import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import Token from "@/components/token";

import styles from "./Top.module.css";

export default function Top() {
  const router = useRouter();
  const { token } = useToken();

  const isIndex = router.asPath === "/";
  const isDocumentation = router.asPath === "/documentation";

  const indexStyles = isIndex ? styles.index : "";

  return (
    <header className={`${styles.top} ${indexStyles}`}>
      <Container fluid>
        <Row>
          <Col className={styles.left}>
            <Title className={styles.logo}>
              <span>
                <Link href="/">DBC Gateway</Link> 🥳
              </span>
            </Title>
          </Col>
          <Col className={styles.middle}>
            {!isIndex && <Token className={styles.token} compact />}
          </Col>
          <Col as="nav" className={styles.links}>
            <Text type="text5" className={styles.link}>
              <Link href="/documentation" disabled={!token}>
                Documentation
              </Link>
            </Text>
            <Text type="text5" className={styles.link}>
              <Link href="/graphiql" disabled={!token}>
                GraphiQL
              </Link>
            </Text>
            <Text type="text5" className={styles.link}>
              <Link href="/" disabled={!token}>
                Voyager
              </Link>
            </Text>
            <Text type="text5" className={styles.link}>
              <Link href="/" disabled={!token}>
                Extras
              </Link>
            </Text>
          </Col>
        </Row>
      </Container>
    </header>
  );
}
