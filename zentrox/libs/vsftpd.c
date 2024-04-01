#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <shadow.h>
#include <stdlib.h>

#define MAX_STRING 2048

// This application creates and updates users for Zentrox

// TODO 1. User update (mode = 1)
// TODO     a) Modify user
// TODO     b) Update userlist (may also have >1 users)
// TODO     c) Update .conf if required
// TODO 2. Initial configuration update
// TODO     a) Like 1.b and .c
// TODO     b) systemctl restart

int chpasswd(char *username, char *password)
{
    FILE *shadow_file = fopen("/home/---/shadow.txt", "r+"); // ? I changed the file to a copy for now.
    FILE *shadow_file_write = fopen("/home/---/shadow.txt", "w+");
    char shadow_file_line[MAX_STRING];
    char *password_encrypted;
    struct spwd *shadow_entry;
    if (!shadow_file)
    {
        printf("Failed to open /etc/passwd\nPlease make sure, you run this program as root.\n");
        return -2;
    }
    while ((shadow_entry = fgetspent(shadow_file)) != NULL) {
        if (!strcmp(shadow_entry->sp_namp, username)) {
            // printf("Found %s \n", shadow_entry->sp_namp);
            password_encrypted = crypt(password, shadow_entry->sp_pwdp);
            if (password_encrypted == NULL) {
                printf("Failed to encrypt password.\n");
                return -3;
            }
            strncpy(shadow_entry->sp_pwdp, password_encrypted, sizeof(shadow_entry->sp_pwdp));
            printf("Changed password for %s", username);
            break;
        }
    }

    fseek(shadow_file, -1 * sizeof(struct spwd), SEEK_CUR);
    putspent(shadow_entry, shadow_file);
    
    fclose(shadow_file);
}


int main(int argc, char* argv[])
{
    int mode = 0;

    if (argc < 2) {
        printf("Too few arguments.\n");
        return -1;
    }
    
    if (!strcmp(argv[1], "updateUser")) {
        printf("Update user is not yet done.\n");
        chpasswd(argv[2], argv[3]);
        // ? Update user
    }
    else if (!strcmp(argv[1], "updateConfig")) {
        // ? Update vsftpdConfig
    }
    else {
        printf("This command was not found.\n");
        return -1;
    }
}