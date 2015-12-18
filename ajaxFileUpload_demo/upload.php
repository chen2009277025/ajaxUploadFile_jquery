<?php

if ($_FILES["file"]["error"] > 0)
  {
  echo "Error: " . $_FILES["file"]["error"] . "<br />";
  }
else
  {
  // echo "Upload: " . $_FILES["file"]["name"] . "<br />";
  // echo "Type: " . $_FILES["file"]["type"] . "<br />";
  // echo "Size: " . ($_FILES["file"]["size"] / 1024) . " Kb<br />";
  // echo "Stored in: " . $_FILES["file"]["tmp_name"];
}

echo "{\"code\":0,\"data\":\"http://p0.meituan.net/xianfu/b71dec0473733a51cf64d83c7abdf6b063488.jpg\",\"msg\":\"成功\"}";

?>
