import {
  Box,
  Button,
  InputBase,
  IconButton,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
} from "@mui/material";
import Search from "@mui/icons-material/Search";
import { useState } from "react";
import { fetchReactions } from "./api/fetchReactions";
import { postReminder } from "./api/postReminder";

type User = {
  id: string;
  name: string;
  displayNname: string;
  isReacted: boolean;
  isSender: boolean;
};

type Column = {
  name: string;
  align?: "center";
};

const columns: Column[] = [
  {
    name: "✅",
  },
  {
    name: "ID",
  },
  {
    name: "名前",
    align: "center",
  },
  {
    name: "表示名",
    align: "center",
  },
  {
    name: "リアクション有無",
    align: "center",
  },
];

const MainComponent = () => {
  const [url, setURL] = useState("");
  const [rows, setRows] = useState<User[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [messageText, setMessageText] = useState<string>("");

  const handleURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setURL(event.target.value);
  };

  const handleSearch = () => {
    fetchReactions(url)
      .then((reactions) => {
        const users = reactions?.users;
        if (users) {
          setRows([]);
          setMessageText(reactions.message.text);
          const userRows = users.map((u) => {
            return {
              id: u.id,
              name: u.name,
              displayNname: u.displayName,
              isReacted: u.isReacted,
              isSender: u.isSender,
            };
          });
          setSelected(
            users.filter((u) => !u.isReacted && !u.isSender).map((u) => u.id)
          );
          setRows(userRows);
        } else {
          window.alert("取得できませんでした。");
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleSubmit = () => {
    const message = ["リアクションしてください。", url].join("\r\n");
    selected.forEach((selectedId) => {
      postReminder(selectedId, message)
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.error(error);
        });
    });
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);

    const getNewSelected = (
      selected: readonly string[],
      selectedIndex: number,
      id: string
    ): readonly string[] => {
      if (selectedIndex === -1) {
        return [...selected, id];
      } else if (selectedIndex === 0) {
        return selected.slice(1);
      } else if (selectedIndex === selected.length - 1) {
        return selected.slice(0, -1);
      }

      return [
        ...selected.slice(0, selectedIndex),
        ...selected.slice(selectedIndex + 1),
      ];
    };
    const newSelected = getNewSelected(selected, selectedIndex, id);

    setSelected(newSelected);
  };

  const isSelected = (name: string) => {
    return selected.indexOf(name) !== -1;
  };

  return (
    <>
      <Paper
        component="form"
        sx={{
          mb: 1,
          display: "flex",
          alignItems: "center",
          minWidth: 400,
        }}
      >
        <InputBase
          sx={{ px: 2, flex: 1, textAlign: "bottom" }}
          placeholder="メッセージURL"
          value={url}
          onChange={handleURLChange}
        />
        <Divider sx={{ height: 28 }} orientation="vertical" />
        <Box sx={{ m: 0.5 }}>
          <IconButton
            color="primary"
            sx={{ p: 0.5 }}
            aria-label="serch"
            onClick={handleSearch}
          >
            <Search />
          </IconButton>
        </Box>
      </Paper>
      {messageText && (
        <Paper
          sx={{
            mb: 1,
            p: 1,
            alignItems: "center",
            minWidth: 400,
          }}
        >
          <Typography component="div" color="text.secondary" gutterBottom>
            メッセージ
          </Typography>
          <Typography variant="body2">{messageText}</Typography>
        </Paper>
      )}
      <Paper sx={{ minWidth: 400 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => {
                return (
                  <TableCell key={col.name} align={col.align ?? "inherit"}>
                    {col.name}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isItemSelected = isSelected(row.id);
              return (
                <TableRow
                  hover
                  key={row.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      inputProps={{
                        "aria-labelledby": row.name,
                      }}
                      onClick={(event) => handleClick(event, row.id)}
                      disabled={row.isSender}
                    />
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.id}
                  </TableCell>
                  <TableCell align="center">{row.name}</TableCell>
                  <TableCell align="center">{row.displayNname}</TableCell>
                  <TableCell align="center">
                    {row.isSender ? "-" : row.isReacted ? "○" : "×"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{ mt: 3, ml: 1 }}
        >
          送信
        </Button>
      </Box>
    </>
  );
};

const App = (): JSX.Element => {
  const title = "Slack Reminder";
  return (
    <Box className="App" sx={{ maxWidth: 800 }}>
      <h1>{title}</h1>
      <MainComponent />
    </Box>
  );
};

export default App;
