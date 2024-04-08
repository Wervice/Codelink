echo "Compiling with -lcrypt -c"
gcc ../libs/vsftpd.c -lcrypt -c
echo "Executing with updateUser ftp_zentrox def"
../libs/a.out updateUser ftp_zentrox def
if [ $? -eq 0]
    then
        echo "Execution failed"
        return -1;
    else
        ec