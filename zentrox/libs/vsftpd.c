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

int chpasswd(const char *username, const char *password)
{
    char shadow_file_line[MAX_STRING]; 
    char *password_encrypted;
    int user_password_changed = 0;
    struct spwd *shadow_entry;
    FILE *shadow_file = fopen("/home/constantin/shadow.txt", "r+"); // ? I changed the file to a copy for now.
    
    if (!shadow_file)
    {
        printf("Failed to open /etc/passwd\nPlease make sure, you run this program as root.\n");
        return -2;
    }
    while ((shadow_entry = fgetspent(shadow_file)) != NULL) {
        printf("Current user %s\n", shadow_entry->sp_namp);
        if (strcmp(shadow_entry->sp_namp, username) == 0) {
            printf("Found %s \n", shadow_entry->sp_namp);
            char setting_prefix[MAX_STRING] = "$6$";
            char setting_suffix[2] = "$";
            char setting_salt[MAX_STRING] = "itsloremfuckingipsum";
            strncat(setting_prefix, setting_salt, strlen(setting_prefix));
            strncat(setting_prefix, setting_suffix, strlen(setting_prefix));
            password_encrypted = crypt(password, setting_prefix);
            printf("%s\n", password_encrypted);
            if (password_encrypted == NULL) {
                printf("Failed to encrypt password.\n");
                return -3;
            }
            strncpy(shadow_entry->sp_pwdp, password_encrypted, sizeof(shadow_entry->sp_pwdp));
            printf("Changed password for %s\n", username);
            user_password_changed = 1;
            break;
        }
    }
    if (user_password_changed == 0) {
        printf("No user was found");
        return -1;
    }
    
    fseek(shadow_file, -1 * sizeof(struct spwd), SEEK_CUR); // TODO Nothing is written to the file, fix!
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
        char username[512] = "ftp_zentrox";
        char password[512] = "def";
        chpasswd(username, password);
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