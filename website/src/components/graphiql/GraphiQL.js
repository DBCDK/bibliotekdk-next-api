import React, { useEffect, useRef, useState } from "react";
import _GraphiQL from "graphiql";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";
import useIntersection from "@/hooks/useIntersection";

import Text from "@/components/base/text";
import Button from "@/components/base/button";
import Input from "@/components/base/input";

import Header from "@/components/header";
import Overlay from "@/components/base/overlay";

import styles from "./GraphiQL.module.css";

// A storage implementation that does nothing
// Basically prevents inline graphiql to interfere with the "real" graphiql
const noStorage = {
  getItem: () => {},
  removeItem: () => {},
  setItem: () => {},
  length: 0,
};

/**
 * Shows an empy grey box, calls inView when box is in viewport.
 * Used for lazy loading
 *
 * @param {*} props
 * @param {function} props.inView
 * @param {boolean} props.show
 * @returns {component}
 */
function DummyContainer({ inView, show }) {
  const dummyContainerRef = useRef();
  const dummyContainerInView = useIntersection(
    dummyContainerRef.current,
    "0px"
  );
  useEffect(() => {
    if (dummyContainerInView) {
      inView(true);
    }
  }, [dummyContainerInView]);
  return (
    <div
      className={styles.dummycontainer}
      ref={dummyContainerRef}
      style={{ display: show ? "block" : "none" }}
    />
  );
}

export function InlineGraphiQL({ query, variables }) {
  const { selectedToken } = useStorage();
  const instanceRef = useRef();

  // This is used for lazy loading
  const [showDummyContainer, setShowDummyContainer] = useState(true);

  const curlRef = useRef();
  const { schema } = useSchema(selectedToken);
  const url = useGraphQLUrl();

  const [showCopy, setShowCopy] = useState(false);
  const [editQuery, setEditQuery] = useState(query);
  const [editVariables, setEditVariables] = useState(variables);

  const curl_vars = editVariables?.replace?.(/\s+/g, " ");
  const curl_query = editQuery?.replace(/\s+/g, " ");
  const curl = `curl -H "Authorization: bearer ${selectedToken?.token}" -H "Content-Type: application/json" -X POST -d '{"query": "${curl_query}", "variables": ${curl_vars}}' ${url}`;

  // When the selected token has changed, we unmount graphiql
  // and mounts the dummy container. Graphiql will be reinstantiated
  // when the dummy container is in the viewport again
  useEffect(() => {
    setShowDummyContainer(true);
  }, [selectedToken]);

  return (
    <div className={styles.inlinegraphiql}>
      <Button
        size="small"
        className={`${styles.button} ${styles.run}`}
        onClick={() => {
          instanceRef.current?.handleRunQuery?.();
        }}
      >
        Run 🚀
      </Button>
      <Button
        secondary
        size="small"
        className={`${styles.button} ${styles.prettify}`}
        onClick={() => {
          instanceRef.current?.handlePrettifyQuery?.();
        }}
      >
        Prettify ✨
      </Button>

      {/* <Button
        secondary
        size="small"
        className={`${styles.button} ${styles.copy}`}
        onClick={() => {
          instanceRef.current.handleCopyQuery();
        }}
      >
        Copy 🗐
      </Button> */}

      <DummyContainer
        inView={() => setShowDummyContainer(false)}
        show={showDummyContainer}
      />

      {schema && !showDummyContainer && (
        <GraphiQLFix
          schema={schema}
          fetcher={async (graphQLParams) => {
            const data = await fetch(url, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `bearer ${selectedToken?.token}`,
              },
              body: JSON.stringify(graphQLParams),
              credentials: "same-origin",
            });
            return data.json().catch(() => data.text());
          }}
          query={query}
          onEditQuery={(str) => setEditQuery(str)}
          onEditVariables={(str) => setEditVariables(str)}
          secondaryEditorOpen={true}
          variableEditorActive={true}
          variables={variables ? JSON.stringify(variables) : ""}
          headerEditorEnabled={false}
          secondaryEditorHeight={120}
          onMount={(instance) => {
            instanceRef.current = instance;
            instanceRef.current.handlePrettifyQuery();
            instanceRef.current.handleRunQuery();
          }}
          storage={noStorage}
        />
      )}

      <Input
        elRef={curlRef}
        value={curl}
        readOnly={true}
        className={styles.curl}
        onClick={(e) => {
          e.target.select();
          navigator?.clipboard?.writeText?.(e.target.value);
          setShowCopy(true);
          setTimeout(() => setShowCopy(false), 2000);
        }}
      />

      <Overlay show={navigator?.clipboard && showCopy} container={curlRef}>
        <Text type="text1">Copied to clipboard 📋</Text>
      </Overlay>
    </div>
  );
}

export default function GraphiQL() {
  const { selectedToken } = useStorage();
  const { schema } = useSchema(selectedToken);
  const url = useGraphQLUrl(selectedToken);
  return (
    <div className={styles.graphiql}>
      <Header />
      <GraphiQLFix
        schema={schema}
        fetcher={async (graphQLParams) => {
          const data = await fetch(url, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `bearer ${selectedToken?.token}`,
            },
            body: JSON.stringify(graphQLParams),
            credentials: "same-origin",
          });
          return data.json().catch(() => data.text());
        }}
        defaultVariableEditorOpen={true}
        headerEditorEnabled={false}
      />
    </div>
  );
}

class GraphiQLFix extends _GraphiQL {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      secondaryEditorHeight:
        props.secondaryEditorHeight || this.state.secondaryEditorHeight,
    };
  }

  componentDidMount() {
    if (this.props.onMount) {
      this.props.onMount(this);
    }
    super.componentDidMount();
  }

  componentDidUpdate(...args) {
    const editor = this.getQueryEditor();
    if (editor && this.state.schema) {
      editor.state.lint.linterOptions.schema = this.state.schema;
    }
    return super.componentDidUpdate(...args);
  }
}
